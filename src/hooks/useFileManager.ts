import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { writeAuditLog } from '@/lib/audit-log'

export const MEDIA_BUCKET = 'media'

export const ALLOWED_TYPES: Record<string, string[]> = {
  images:    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  videos:    ['video/mp4', 'video/webm', 'video/ogg'],
}

export const ALL_ALLOWED_TYPES = Object.values(ALLOWED_TYPES).flat()
export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export type FileItem = {
  name: string
  id: string | undefined
  fullPath: string
  folder: string
  size: number
  mimeType: string
  createdAt: string
  updatedAt: string
  publicUrl: string
  isFolder: boolean
}

function getFileCategory(mimeType: string): string {
  if (ALLOWED_TYPES.images.includes(mimeType))    return 'images'
  if (ALLOWED_TYPES.documents.includes(mimeType)) return 'documents'
  if (ALLOWED_TYPES.videos.includes(mimeType))    return 'videos'
  return 'other'
}

function buildPublicUrl(path: string): string {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function useFileManager(folder = '') {
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const queryKey = ['file-manager', folder]

  const { data: files = [], isLoading, isError, refetch } = useQuery<FileItem[]>({
    queryKey,
    queryFn: async () => {
      const prefix = folder ? `${folder}/` : ''
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(folder || undefined, {
          limit: 200,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) {
        if (error.message?.includes('does not exist') || error.message?.includes('Bucket not found')) {
          return []
        }
        throw error
      }

      return (data || []).map((item) => {
        const isFolder = !item.metadata
        const fullPath = prefix + item.name
        return {
          name: item.name,
          id: item.id ?? undefined,
          fullPath,
          folder,
          size: item.metadata?.size ?? 0,
          mimeType: item.metadata?.mimetype ?? '',
          createdAt: item.created_at ?? '',
          updatedAt: item.updated_at ?? '',
          publicUrl: isFolder ? '' : buildPublicUrl(fullPath),
          isFolder,
        } as FileItem
      })
    },
    staleTime: 30 * 1000,
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ file, targetFolder }: { file: File; targetFolder?: string }) => {
      if (!ALL_ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`File type "${file.type}" is not allowed. Upload images, PDFs, Word docs, or videos only.`)
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 20 MB.`)
      }

      const dest = targetFolder ?? folder
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const uniqueName = `${Date.now()}-${sanitized}`
      const path = dest ? `${dest}/${uniqueName}` : uniqueName

      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, {
          cacheControl: '15552000',
          upsert: false,
        })

      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))

      if (error) throw error

      return { path, publicUrl: buildPublicUrl(path) }
    },
    onSuccess: (result, { file }) => {
      queryClient.invalidateQueries({ queryKey })
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
      }, 1500)
      toast.success('File uploaded successfully.')
      void writeAuditLog({
        action: 'file.uploaded',
        resource: 'storage',
        resourceId: result.path,
        newValue: { name: file.name, size: file.size, type: file.type },
      })
    },
    onError: (err: Error, { file }) => {
      setUploadProgress((prev) => {
        const next = { ...prev }
        delete next[file.name]
        return next
      })
      toast.error(err.message || 'Upload failed.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([filePath])
      if (error) throw error
      return filePath
    },
    onSuccess: (filePath) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('File deleted.')
      void writeAuditLog({ action: 'file.deleted', resource: 'storage', resourceId: filePath, severity: 'warning' })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Delete failed.')
    },
  })

  const copyUrl = useCallback((url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`Copied URL for "${name}"`)
    })
  }, [])

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }, [])

  const getCategory = useCallback(getFileCategory, [])

  return {
    files,
    isLoading,
    isError,
    refetch,
    uploadProgress,
    uploadFile: uploadMutation.mutate,
    uploadLoading: uploadMutation.isPending,
    deleteFile: deleteMutation.mutate,
    deleteLoading: deleteMutation.isPending,
    copyUrl,
    formatSize,
    getCategory,
  }
}

import { useEffect, useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export type ChatMessage = {
  id: string
  sender_id: string
  receiver_id: string | null
  message: string
  /** Storage path inside the private `chat-attachments` bucket (older rows may hold a full URL). */
  file_url: string | null
  file_name: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

const ATTACHMENT_BUCKET = 'chat-attachments'
const ATTACHMENT_FAILED = 'Your attachment could not be uploaded. Please try a PDF, JPG or PNG under 5 MB.'

/** Plain messages only — raw Supabase errors must never reach the applicant. */
function friendlyChatError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null
  if (e?.message === ATTACHMENT_FAILED) return ATTACHMENT_FAILED
  if (e?.code === 'PGRST205' || e?.code === '42P01') {
    return 'Chat is not available right now. Please contact our team on WhatsApp while we fix this.'
  }
  return 'Your message could not be sent. Please try again.'
}

/**
 * Opens an attachment through a short-lived signed URL, because chat files
 * (passports, certificates) live in a private bucket.
 */
export async function openChatAttachment(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    window.open(pathOrUrl, '_blank', 'noopener,noreferrer')
    return
  }
  // Open the tab synchronously so popup blockers allow it, then point it at the signed URL.
  const tab = window.open('', '_blank')
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(pathOrUrl, 60)
  if (error || !data?.signedUrl) {
    tab?.close()
    toast.error('This attachment could not be opened. Please try again.')
    return
  }
  if (tab) {
    tab.opener = null
    tab.location.href = data.signedUrl
  } else {
    window.location.assign(data.signedUrl)
  }
}

export function useChat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [officerTyping, setOfficerTyping] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // 1. Fetch chat history
  const query = useQuery<ChatMessage[], Error>({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('Chat history failed to load:', error.message)
        // Surface as isError so the page can say so, instead of an empty "start your conversation" state.
        throw new Error('Chat history could not be loaded.')
      }
      return data as ChatMessage[]
    },
    enabled: !!user,
    staleTime: 0, // Keep fresh
  })

  // Mark all incoming messages as read when viewing
  const markMessagesAsRead = useCallback(async () => {
    if (!user) return
    const unread = query.data?.filter((m) => m.receiver_id === user.id && !m.is_read) || []
    if (unread.length === 0) return

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['messages', user.id] })
    }
  }, [user, query.data, queryClient])

  useEffect(() => {
    markMessagesAsRead()
  }, [query.data, markMessagesAsRead])

  // 2. Realtime listener for new messages + typing status
  useEffect(() => {
    if (!user) return

    const logicalName = `realtime-chat-${user.id}`
    for (const existing of supabase.getChannels()) {
      if (existing.topic.includes(logicalName)) {
        void supabase.removeChannel(existing)
      }
    }

    const uniqueName = `${logicalName}:${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(uniqueName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', user.id] })
        },
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.sender === 'officer') {
          setOfficerTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => {
            setOfficerTyping(false)
          }, 3000)
        }
      })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      channelRef.current = null
      void supabase.removeChannel(channel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [user, queryClient])

  // 3. Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      file,
    }: {
      text: string
      file?: File
    }) => {
      if (!user) throw new Error('Not authenticated')

      let filePath: string | null = null
      let fileName: string | null = null

      if (file) {
        const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
        // First folder must be the user's id: the storage policies only allow uploads there.
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(path, file, { contentType: file.type || undefined, upsert: false })

        if (uploadError) {
          logger.error('Chat attachment upload failed:', uploadError.message)
          // Never send the message silently without the file the applicant attached.
          throw new Error(ATTACHMENT_FAILED)
        }
        filePath = path
        fileName = file.name
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: null, // assigned case officer defaults to system/admin
            message: text.trim(),
            file_url: filePath,
            file_name: fileName,
            is_read: false,
          },
        ])
        .select()
        .single()

      if (error) {
        logger.error('Chat message insert failed:', error.code, error.message)
        throw error
      }
      return data as ChatMessage
    },
    onMutate: async (newMsg) => {
      // Optimistic updates
      await queryClient.cancelQueries({ queryKey: ['messages', user?.id] })
      const previous = queryClient.getQueryData<ChatMessage[]>(['messages', user?.id])

      if (previous) {
        queryClient.setQueryData<ChatMessage[]>(
          ['messages', user?.id],
          [
            ...previous,
            {
              id: `optimistic-${Date.now()}`,
              sender_id: user?.id || '',
              receiver_id: null,
              message: newMsg.text,
              file_url: null,
              file_name: newMsg.file?.name || null,
              is_read: false,
              read_at: null,
              created_at: new Date().toISOString(),
            },
          ]
        )
      }
      return { previous }
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', user?.id], context.previous)
      }
      toast.error(friendlyChatError(err))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id] })
    },
  })

  // 4. Send typing broadcast trigger
  const sendTypingBroadcast = async () => {
    if (!user || !channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'user' },
    })
  }

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    sendMessage: sendMutation.mutate,
    sendLoading: sendMutation.isPending,
    officerTyping,
    sendTypingBroadcast,
  }
}

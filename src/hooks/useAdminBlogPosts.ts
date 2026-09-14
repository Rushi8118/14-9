import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import type { GeneratedBlogPost } from '@/lib/ai/blog-generator'
import { toast } from 'sonner'
import { absoluteUrl } from '@/lib/seo/site'
import { sanitizeRichText } from '@/lib/security/sanitizeHtml'
import { writeAuditLog } from '@/lib/audit-log'

export type AdminBlogFaqItem = { question: string; answer: string }

export type AdminBlogPost = {
  id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: string
  tags: string[] | null
  meta_title: string | null
  meta_desc: string | null
  keywords: string[] | null
  canonical_url: string | null
  featured_image: string | null
  status: string
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
  focus_keyword: string | null
  related_keywords: string[]
  long_tail_keywords: string[]
  search_intent: string | null
  faq: AdminBlogFaqItem[]
  internal_links: string[]
  related_urgent_requirements: string[]
  image_alt: string | null
  image_caption: string | null
  reading_time_minutes: number | null
  structured_data: Record<string, unknown>
  last_reviewed_at: string | null
  disclaimer: string | null
  ai_generated: boolean
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function asFaqArray(value: unknown): AdminBlogFaqItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' ? item as Record<string, unknown> : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({ question: String(item.question || ''), answer: String(item.answer || '') }))
    .filter((item) => item.question && item.answer)
}

function normalizeRow(row: Record<string, unknown>): AdminBlogPost {
  return {
    id: String(row.id),
    author_id: (row.author_id as string) || null,
    title: String(row.title || ''),
    slug: String(row.slug || ''),
    excerpt: (row.excerpt as string) || null,
    content: String(row.content || ''),
    category: String(row.category || 'general'),
    tags: asStringArray(row.tags),
    meta_title: (row.meta_title as string) || null,
    meta_desc: (row.meta_desc as string) || null,
    keywords: asStringArray(row.keywords),
    canonical_url: (row.canonical_url as string) || null,
    featured_image: (row.featured_image as string) || null,
    status: String(row.status || 'draft'),
    published_at: (row.published_at as string) || null,
    view_count: Number(row.view_count || 0),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    focus_keyword: (row.focus_keyword as string) || null,
    related_keywords: asStringArray(row.related_keywords),
    long_tail_keywords: asStringArray(row.long_tail_keywords),
    search_intent: (row.search_intent as string) || null,
    faq: asFaqArray(row.faq),
    internal_links: asStringArray(row.internal_links),
    related_urgent_requirements: asStringArray(row.related_urgent_requirements),
    image_alt: (row.image_alt as string) || null,
    image_caption: (row.image_caption as string) || null,
    reading_time_minutes: row.reading_time_minutes != null ? Number(row.reading_time_minutes) : null,
    structured_data: (row.structured_data as Record<string, unknown>) || {},
    last_reviewed_at: (row.last_reviewed_at as string) || null,
    disclaimer: (row.disclaimer as string) || null,
    ai_generated: Boolean(row.ai_generated),
  }
}

export function useAdminBlogPosts() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data || []).map((row) => normalizeRow(row as Record<string, unknown>))
    },
  })

  const saveGenerated = useMutation({
    mutationFn: async (input: {
      draft: GeneratedBlogPost
      status: 'draft' | 'review' | 'published'
      id?: string
    }) => {
      if (!user) throw new Error('Not authenticated')

      const sanitizedContent = sanitizeRichText(input.draft.content)

      const rpcPayload = {
        id: input.id || null,
        title: input.draft.title,
        slug: input.draft.slug,
        excerpt: input.draft.excerpt,
        content: sanitizedContent,
        category: input.draft.category,
        tags: input.draft.tags,
        meta_title: input.draft.meta_title,
        meta_desc: input.draft.meta_desc,
        keywords: input.draft.keywords,
        canonical_url: absoluteUrl(input.draft.canonical_path),
        status: input.status,
        focus_keyword: input.draft.focus_keyword,
        related_keywords: input.draft.related_keywords,
        long_tail_keywords: input.draft.long_tail_keywords,
        search_intent: input.draft.search_intent,
        faq: input.draft.faq,
        internal_links: input.draft.internal_links,
        related_urgent_requirements: input.draft.related_urgent_requirements,
        image_alt: input.draft.image_alt,
        image_caption: input.draft.image_caption,
        reading_time_minutes: input.draft.reading_time_minutes,
        last_reviewed_at: new Date().toISOString(),
        disclaimer: input.draft.disclaimer,
        ai_generated: true,
      }

      // Prefer SECURITY DEFINER RPC (works even when table RLS is misconfigured,
      // and does server-side slug-uniqueness + permission checks).
      const rpc = await supabase.rpc('save_blog_post', { payload: rpcPayload })
      if (!rpc.error && rpc.data) {
        return normalizeRow(rpc.data as Record<string, unknown>)
      }
      const functionMissing = /Could not find the function|schema cache|PGRST202/i.test(rpc.error?.message || '')
      if (rpc.error && !functionMissing) {
        // A real validation/authorization error (duplicate slug, missing
        // title, insufficient role) — surface it rather than silently
        // falling through to a write path with none of those checks.
        throw new Error(rpc.error.message)
      }

      // Fallback: direct table write (only reached if the RPC itself is
      // missing from the schema cache, e.g. migration not yet applied).
      const now = new Date().toISOString()
      const row = {
        author_id: user.id,
        title: input.draft.title,
        slug: input.draft.slug,
        excerpt: input.draft.excerpt,
        content: sanitizedContent,
        category: input.draft.category,
        tags: input.draft.tags,
        meta_title: input.draft.meta_title,
        meta_desc: input.draft.meta_desc,
        keywords: input.draft.keywords,
        canonical_url: absoluteUrl(input.draft.canonical_path),
        status: input.status,
        published_at: input.status === 'published' ? now : null,
        updated_at: now,
      }

      if (input.id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(row)
          .eq('id', input.id)
          .select('*')
          .single()
        if (error) {
          if (/row-level security|permission|save_blog_post|Could not find the function/i.test(
            `${rpc.error?.message || ''} ${error.message}`,
          )) {
            throw new Error(
              'Database blocked the save. Run supabase/FIX_BLOG_SAVE.sql in Supabase SQL Editor, then try again.',
            )
          }
          throw error
        }
        return normalizeRow(data as Record<string, unknown>)
      }

      const { data, error } = await supabase.from('blog_posts').insert(row).select('*').single()
      if (error) {
        if (/row-level security|permission|save_blog_post|Could not find the function/i.test(
          `${rpc.error?.message || ''} ${error.message}`,
        )) {
          throw new Error(
            'Database blocked the save. Run supabase/FIX_BLOG_SAVE.sql in Supabase SQL Editor, then try again.',
          )
        }
        throw error
      }
      return normalizeRow(data as Record<string, unknown>)
    },
    onSuccess: (post, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] })
      queryClient.invalidateQueries({ queryKey: ['blogPost', post.slug] })
      toast.success(
        vars.status === 'published' ? 'Blog published.' : 'Blog saved as draft.',
      )
      void writeAuditLog({
        action: vars.id ? 'blog.updated' : 'blog.created',
        resource: 'blog_posts',
        resourceId: post.id,
        newValue: { title: post.title, slug: post.slug, status: post.status },
      })
      if (vars.status === 'published') {
        void writeAuditLog({ action: 'blog.published', resource: 'blog_posts', resourceId: post.id, newValue: { slug: post.slug } })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save blog')
    },
  })

  const setStatus = useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const patch: Record<string, unknown> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      }
      if (input.status === 'published') {
        patch.published_at = new Date().toISOString()
      }
      const { error } = await supabase.from('blog_posts').update(patch).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] })
      toast.success('Status updated.')
      void writeAuditLog({
        action: input.status === 'published' ? 'blog.published' : 'blog.unpublished',
        resource: 'blog_posts',
        resourceId: input.id,
        newValue: { status: input.status },
      })
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update status'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] })
      toast.success('Post deleted.')
      void writeAuditLog({ action: 'blog.deleted', resource: 'blog_posts', resourceId: id, severity: 'warning' })
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete post'),
  })

  return {
    posts: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveGenerated: saveGenerated.mutateAsync,
    saving: saveGenerated.isPending,
    setStatus: setStatus.mutate,
    remove: remove.mutate,
  }
}

export function usePublicBlogPosts() {
  return useQuery({
    queryKey: ['blogPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      if (error) throw error
      return (data || []).map((row) => normalizeRow(row as Record<string, unknown>))
    },
  })
}

export function usePublicBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['blogPost', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return normalizeRow(data as Record<string, unknown>)
    },
  })
}

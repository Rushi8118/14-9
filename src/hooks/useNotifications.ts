import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export type Notification = {
  id: string
  user_id: string
  type: 'application_update' | 'consultation_reminder' | 'payment_due' | 'document_request' | 'general' | 'promotion'
  title: string
  message: string | null
  action_url: string | null
  action_label: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  const query = useQuery<Notification[], Error>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Notification[]
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    // Realtime pushes new rows instantly; polling is the fallback if the realtime connection drops
    // or the notifications table isn't in the supabase_realtime publication yet.
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribePostgresChanges(
      supabase,
      `user-notifications-${userId}`,
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        const event = payload as { eventType?: string; new?: Notification }
        if (event.eventType === 'INSERT' && event.new) {
          toast.info(event.new.title, {
            description: event.new.message || 'You have a new update.',
          })
        }
      },
    )

    return unsubscribe
  }, [userId, queryClient])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId])
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ['notifications', userId],
          previous.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        )
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous)
      }
      toast.error('Failed to mark notification as read.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (error) throw error
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] })
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId])
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ['notifications', userId],
          previous.map((n) => ({ ...n, is_read: true })),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous)
      }
      toast.error('Failed to mark all as read.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      toast.success('All notifications marked as read.')
    },
  })

  const unreadCount = query.data?.filter((n) => !n.is_read).length || 0

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  }
}

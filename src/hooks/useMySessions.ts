import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import type { AdminSession } from './useActiveSessions'

export type AccountSession = Pick<
  AdminSession,
  'id' | 'browser' | 'os' | 'device_type' | 'location' | 'is_active' | 'last_seen' | 'created_at'
>

/** The signed-in user's own recorded sessions (RLS: "Users can read own sessions"). */
export function useMySessions() {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<AccountSession[], Error>({
    queryKey: ['my-sessions', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('id, browser, os, device_type, location, is_active, last_seen, created_at')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data ?? []) as AccountSession[]
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  })

  const signOutOthersMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Other sessions signed out.', { description: 'Only this device remains signed in.' })
      void query.refetch()
    },
    onError: () => {
      toast.error('Unable to sign out other sessions.', { description: 'Please try again.' })
    },
  })

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    signOutOthers: signOutOthersMutation.mutate,
    signOutOthersLoading: signOutOthersMutation.isPending,
  }
}

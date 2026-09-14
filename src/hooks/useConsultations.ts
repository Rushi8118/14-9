import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { useAuth } from './use-auth'

export type ConsultationType = 'work_visa' | 'study_visa' | 'document_review' | 'mock_interview'

export type Consultation = {
  id: string
  user_id: string | null
  consultation_type: string
  status: 'requested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  scheduled_at: string
  duration_minutes: number | null
  phone_number: string | null
  whatsapp_number: string | null
  preferred_country: string | null
  visa_category: string | null
  user_notes: { notes?: string } | null
  consultant_notes: string | null
  created_at: string
  updated_at: string
}

export type NewConsultation = {
  consultationType: ConsultationType
  country: string
  phone?: string
  whatsapp?: string
  notes?: string
}

export function useConsultations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  const query = useQuery<Consultation[], Error>({
    queryKey: ['consultations', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as Consultation[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!userId) return

    return subscribePostgresChanges(
      supabase,
      `user-consultations-${userId}`,
      { event: '*', schema: 'public', table: 'consultations', filter: `user_id=eq.${userId}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['consultations', userId] })
      },
    )
  }, [userId, queryClient])

  const createMutation = useMutation({
    mutationFn: async (input: NewConsultation) => {
      if (!userId) throw new Error('Not authenticated')
      const { error } = await supabase.from('consultations').insert([
        {
          user_id: userId,
          consultation_type: input.consultationType,
          status: 'requested',
          scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), // defaults to 2 days later
          phone_number: input.phone || null,
          whatsapp_number: input.whatsapp || null,
          preferred_country: input.country,
          user_notes: {
            notes: input.notes ?? '',
            source: 'user_dashboard',
            submitted_at: new Date().toISOString(),
          },
        },
      ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations', userId] })
      // useAppointments falls back to consultations when the appointments table is unavailable.
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] })
      toast.success('Consultation booked successfully.', {
        description: 'A case officer will confirm your slot shortly.',
      })
    },
    onError: () => {
      toast.error('Unable to book your consultation.', { description: 'Please try again.' })
    },
  })

  return {
    consultations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createConsultation: createMutation.mutateAsync,
    createLoading: createMutation.isPending,
  }
}

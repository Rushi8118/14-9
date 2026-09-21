import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { useAuth } from './use-auth'
import { isAdminOrAbove } from '@/lib/rbac'
import { toast } from 'sonner'
import { markApplicationSubmitted } from '@/lib/site-visit-tracker'

export type Application = {
  id: string
  application_id: string | null
  user_id: string
  visa_program_id: string
  country_id: string
  application_type: 'work' | 'study' | 'business' | 'tourist' | 'investor'
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  personal_info: any
  education_history: any
  work_history: any
  document_checklist: any
  submitted_at: string | null
  review_started_at: string | null
  decision_at: string | null
  estimated_completion: string | null
  assigned_consultant: string | null
  consultant_notes: string | null
  created_at: string
  updated_at: string
  countries?: { name: string; flag_emoji: string }
  visa_programs?: { name: string }
  source?: 'application' | 'consultation'
}

export function useApplications() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = profile ? isAdminOrAbove(profile.user_role) : false

  // 1. Query applications list (unifying direct applications and consultations/inquiries)
  const query = useQuery<Application[], Error>({
    queryKey: ['applications', isAdmin ? 'all' : user?.id],
    queryFn: async () => {
      if (!user) return []

      // Fetch standard applications
      let appsQuery = supabase
        .from('applications')
        .select(`
          *,
          countries(name, flag_emoji),
          visa_programs(name)
        `)
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        appsQuery = appsQuery.eq('user_id', user.id)
      }
      const { data: appsData, error: appsError } = await appsQuery
      if (appsError) throw appsError

      // Fetch consultation enquiries (e.g. from contact page or dashboard application form)
      let consultQuery = supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isAdmin) {
        consultQuery = consultQuery.eq('user_id', user.id)
      }
      const { data: consultData, error: consultError } = await consultQuery

      if (consultError) {
        console.warn('Consultations fetch warning:', consultError)
      }

      const formattedConsultations: Application[] = (consultData || []).map((c: any) => {
        const enqId = 'ENQ-' + (c.id ? c.id.replace(/-/g, '').slice(0, 8).toUpperCase() : 'REF')
        const appType: Application['application_type'] =
          c.consultation_type === 'study_visa' ? 'study' : 'work'
        const appStatus: Application['status'] =
          c.status === 'requested' ? 'submitted' : c.status === 'confirmed' ? 'under_review' : (c.status || 'submitted')

        return {
          id: c.id,
          application_id: enqId,
          user_id: c.user_id || user.id,
          visa_program_id: '',
          country_id: '',
          application_type: appType,
          status: appStatus,
          priority: 'normal',
          personal_info: {
            ...(typeof c.user_notes === 'object' && c.user_notes !== null ? c.user_notes : {}),
            phone_number: c.phone_number,
            whatsapp_number: c.whatsapp_number,
            preferred_country: c.preferred_country,
            visa_category: c.visa_category,
          },
          education_history: [],
          work_history: [],
          document_checklist: {},
          submitted_at: c.created_at,
          review_started_at: null,
          decision_at: null,
          estimated_completion: null,
          assigned_consultant: c.assigned_consultant,
          consultant_notes: c.consultant_notes,
          created_at: c.created_at,
          updated_at: c.updated_at,
          countries: {
            name: c.preferred_country || 'Preferred Country',
            flag_emoji: '✈️',
          },
          visa_programs: {
            name: c.visa_category || (c.consultation_type === 'study_visa' ? 'Study Visa' : 'Work Visa'),
          },
          source: 'consultation',
        }
      })

      const combined = [
        ...((appsData || []).map((a: any) => ({ ...a, source: 'application' as const }))),
        ...formattedConsultations,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return combined as Application[]
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // 2. Realtime subscription to reload applications
  useEffect(() => {
    if (!user?.id) return

    const channelApps = isAdmin ? 'admin-all-apps' : `user-apps-${user.id}`
    const channelConsult = isAdmin ? 'admin-all-consult' : `user-consult-${user.id}`
    const filter = isAdmin ? undefined : `user_id=eq.${user.id}`

    const unsubApps = subscribePostgresChanges(
      supabase,
      channelApps,
      {
        event: '*',
        schema: 'public',
        table: 'applications',
        ...(filter ? { filter } : {}),
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['applications'] })
      },
    )

    const unsubConsult = subscribePostgresChanges(
      supabase,
      channelConsult,
      {
        event: '*',
        schema: 'public',
        table: 'consultations',
        ...(filter ? { filter } : {}),
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['applications'] })
        queryClient.invalidateQueries({ queryKey: ['consultations'] })
      },
    )

    return () => {
      unsubApps?.()
      unsubConsult?.()
    }
  }, [user?.id, queryClient, isAdmin])

  // 3. Submit new application mutation (direct applications table)
  const createApplicationMutation = useMutation({
    mutationFn: async (payload: Partial<Application>) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('applications')
        .insert([{ ...payload, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      markApplicationSubmitted(user?.id ?? null, data?.application_id, data?.application_type)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application started successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit application.')
    },
  })

  // 4. Submit inquiry mutation (consultations table matching contact form)
  const createInquiryMutation = useMutation({
    mutationFn: async (payload: {
      type: 'work' | 'study'
      phone?: string
      whatsapp?: string
      preferred_country?: string
      visa_category?: string
      user_notes?: Record<string, any>
    }) => {
      if (!user) throw new Error('Not authenticated')

      const insertData: any = {
        consultation_type: payload.type === 'work' ? 'work_visa' : 'study_visa',
        status: 'requested',
        scheduled_at: new Date().toISOString(),
        phone_number: payload.phone || null,
        whatsapp_number: payload.whatsapp || null,
        preferred_country: payload.preferred_country || null,
        visa_category: payload.visa_category || null,
        user_notes: {
          ...payload.user_notes,
          source: 'dashboard_applications',
          submitted_at: new Date().toISOString(),
        },
        user_id: user.id,
      }

      const { data, error } = await supabase
        .from('consultations')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const generatedId = 'ENQ-' + (data?.id ? data.id.replace(/-/g, '').slice(0, 8).toUpperCase() : 'REF')
      markApplicationSubmitted(
        user?.id ?? null,
        generatedId,
        data?.consultation_type === 'study_visa' ? 'study' : 'work'
      )
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Application submitted successfully!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit application.')
    },
  })

  return {
    applications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createApplication: createApplicationMutation.mutate,
    createLoading: createApplicationMutation.isPending,
    createError: createApplicationMutation.error,
    submitInquiry: createInquiryMutation.mutateAsync,
    inquiryLoading: createInquiryMutation.isPending,
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

export type Appointment = {
  id: string
  user_id: string
  assigned_officer: string | null
  appointment_type: 'Video Call' | 'In-Person' | 'Phone Call'
  status: 'Scheduled' | 'Completed' | 'Cancelled'
  scheduled_at: string
  duration_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
}

type MeetingType = Appointment['appointment_type']

type ConsultationRow = {
  id: string
  user_id: string | null
  assigned_consultant: string | null
  consultation_type: string | null
  status: string
  scheduled_at: string
  duration_minutes: number | null
  user_notes: { notes?: string; meeting_type?: string } | null
  created_at: string
  updated_at: string
}

const MEETING_TYPES: MeetingType[] = ['Video Call', 'In-Person', 'Phone Call']

/**
 * Appointments are stored in `consultations` — the same table the admin panel reads —
 * so every booking shows up for staff. (A separate `appointments` table was never created
 * on the live database, which is why earlier bookings were hard to find.)
 */
function toAppointment(c: ConsultationRow): Appointment {
  const stored = c.user_notes?.meeting_type as MeetingType | undefined
  return {
    id: c.id,
    user_id: c.user_id || '',
    assigned_officer: c.assigned_consultant,
    appointment_type: stored && MEETING_TYPES.includes(stored) ? stored : 'Video Call',
    status:
      c.status === 'cancelled' || c.status === 'no_show'
        ? 'Cancelled'
        : c.status === 'completed'
          ? 'Completed'
          : 'Scheduled',
    scheduled_at: c.scheduled_at,
    duration_minutes: c.duration_minutes || 30,
    notes: c.user_notes?.notes || null,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }
}

export function useAppointments() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery<Appointment[], Error>({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('consultations')
        .select('id,user_id,assigned_consultant,consultation_type,status,scheduled_at,duration_minutes,user_notes,created_at,updated_at')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (error) {
        logger.error('Appointments failed to load:', error.message)
        throw new Error('Your appointments could not be loaded.')
      }
      return ((data || []) as ConsultationRow[]).map(toAppointment)
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })

  const bookMutation = useMutation({
    mutationFn: async (payload: { type: MeetingType; date: Date; timeSlot: string; notes?: string }) => {
      if (!user) throw new Error('Please sign in to book an appointment.')

      // Parse date and timeSlot together (e.g. date: 2026-05-28, slot: "10:00 AM")
      const [time, modifier] = payload.timeSlot.split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0

      const scheduledDate = new Date(payload.date)
      scheduledDate.setHours(hours, minutes, 0, 0)
      if (scheduledDate.getTime() <= Date.now()) throw new Error('Please choose a time in the future.')

      const { data, error } = await supabase
        .from('consultations')
        .insert([
          {
            user_id: user.id,
            consultation_type: 'general',
            // 'requested' so staff see it as a new booking to confirm.
            status: 'requested',
            scheduled_at: scheduledDate.toISOString(),
            duration_minutes: 30,
            user_notes: {
              notes: payload.notes || '',
              meeting_type: payload.type,
              source: 'appointments_page',
              submitted_at: new Date().toISOString(),
            },
          },
        ])
        .select('id')
        .single()

      if (error) {
        logger.error('Appointment booking failed:', error.code, error.message)
        throw new Error('Your appointment could not be booked. Please try again.')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] })
      toast.success('Appointment requested!', {
        description: 'Our team will confirm your slot shortly.',
      })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultations').update({ status: 'cancelled' }).eq('id', id)
      if (error) {
        logger.error('Appointment cancel failed:', error.message)
        throw new Error('The appointment could not be cancelled. Please try again.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', user?.id] })
      toast.success('Appointment cancelled.')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    bookAppointment: bookMutation.mutate,
    bookLoading: bookMutation.isPending,
    cancelAppointment: cancelMutation.mutate,
    cancelLoading: cancelMutation.isPending,
  }
}

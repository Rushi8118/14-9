import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export const NOTIFICATION_TOPICS = [
  {
    key: 'application_updates',
    label: 'Application status updates',
    description: 'When your file moves to a new stage or an outcome is decided.',
  },
  {
    key: 'document_reminders',
    label: 'Document reminders',
    description: 'Missing or rejected documents that need your attention.',
  },
  {
    key: 'appointment_reminders',
    label: 'Appointment reminders',
    description: 'Upcoming consultations and any schedule changes.',
  },
  { key: 'chat_messages', label: 'Officer chat messages', description: 'New replies from your case officer.' },
  {
    key: 'marketing_emails',
    label: 'Marketing emails',
    description: 'New programmes, intake deadlines and seasonal offers.',
  },
] as const

export const NOTIFICATION_CHANNELS = [
  { key: 'email', label: 'Email', description: 'Sent to your account email address.' },
  { key: 'sms', label: 'SMS', description: 'Text messages to your phone number.' },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Messages to your WhatsApp number.' },
  { key: 'in_app', label: 'In-app', description: 'Alerts in your dashboard notification centre.' },
] as const

export type NotificationPreferenceKey =
  | (typeof NOTIFICATION_TOPICS)[number]['key']
  | (typeof NOTIFICATION_CHANNELS)[number]['key']

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

const DEFAULT_PREFERENCES: NotificationPreferences = {
  application_updates: true,
  document_reminders: true,
  appointment_reminders: true,
  chat_messages: true,
  marketing_emails: false,
  email: true,
  sms: false,
  whatsapp: true,
  in_app: true,
}

export type PreferencesStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Preferences live in Supabase Auth user metadata (`notification_preferences`),
 * so no additional table is required. Updates are optimistic with per-key rollback.
 */
export function useNotificationPreferences() {
  const { user } = useAuth()
  const storedJson = JSON.stringify(user?.user_metadata?.notification_preferences ?? {})
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [savingKeys, setSavingKeys] = useState<ReadonlySet<NotificationPreferenceKey>>(new Set())
  const [status, setStatus] = useState<PreferencesStatus>('idle')
  const latest = useRef(preferences)
  const inFlight = useRef(0)

  useEffect(() => {
    if (inFlight.current > 0) return
    const next = { ...DEFAULT_PREFERENCES, ...(JSON.parse(storedJson) as Partial<NotificationPreferences>) }
    latest.current = next
    setPreferences(next)
  }, [storedJson])

  const setPreference = useCallback(async (key: NotificationPreferenceKey, value: boolean) => {
    const previous = latest.current[key]
    latest.current = { ...latest.current, [key]: value }
    setPreferences(latest.current)
    inFlight.current += 1
    setSavingKeys((keys) => new Set(keys).add(key))
    setStatus('saving')

    const { error } = await supabase.auth.updateUser({ data: { notification_preferences: latest.current } })

    inFlight.current -= 1
    setSavingKeys((keys) => {
      const next = new Set(keys)
      next.delete(key)
      return next
    })

    if (error) {
      latest.current = { ...latest.current, [key]: previous }
      setPreferences(latest.current)
      setStatus('error')
      toast.error('Unable to save changes.', { description: 'Please try again.' })
      return
    }

    if (inFlight.current === 0) {
      setStatus('saved')
      toast.success('Notification preferences saved.')
    }
  }, [])

  return { preferences, setPreference, savingKeys, status }
}

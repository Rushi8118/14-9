import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TOPICS,
  useNotificationPreferences,
  type NotificationPreferenceKey,
} from '@/hooks/useNotificationPreferences'
import { Switch } from '@/components/ui/switch'

function PreferenceRow({
  prefKey,
  label,
  description,
  checked,
  saving,
  onChange,
}: {
  prefKey: NotificationPreferenceKey
  label: string
  description: string
  checked: boolean
  saving: boolean
  onChange: (value: boolean) => void
}) {
  const id = `pref-${prefKey}`
  return (
    <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-[var(--desk-navy)]">
          {label}
        </label>
        <p id={`${id}-description`} className="text-sm text-[var(--desk-muted)]">
          {description}
        </p>
      </div>
      <div className="flex min-h-11 shrink-0 items-center gap-2">
        {saving && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[var(--desk-muted)]" aria-hidden="true" />
            <span className="sr-only">Saving</span>
          </>
        )}
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={saving}
          aria-describedby={`${id}-description`}
          className="data-[state=checked]:bg-[var(--desk-navy)]"
        />
      </div>
    </li>
  )
}

export default function NotificationPreferences() {
  const { preferences, setPreference, savingKeys, status } = useNotificationPreferences()

  const statusLine =
    status === 'saving' ? (
      <span className="inline-flex items-center gap-1.5 text-[var(--desk-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Saving preferences...
      </span>
    ) : status === 'saved' ? (
      <span className="inline-flex items-center gap-1.5 text-[var(--desk-success)]">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Preferences saved
      </span>
    ) : status === 'error' ? (
      <span className="inline-flex items-center gap-1.5 text-[var(--desk-danger)]">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Unable to save changes. Please try again.
      </span>
    ) : null

  const sections = [
    {
      id: 'topics',
      title: 'What we notify you about',
      description: 'Choose which updates you want to receive.',
      items: NOTIFICATION_TOPICS,
    },
    {
      id: 'channels',
      title: 'Delivery channels',
      description: 'Choose how we reach you.',
      items: NOTIFICATION_CHANNELS,
    },
  ]

  return (
    <div className="space-y-6">
      <p aria-live="polite" className="min-h-5 text-sm">
        {statusLine}
      </p>
      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`notifications-${section.id}`} className="desk-card p-5 sm:p-6">
            <h2 id={`notifications-${section.id}`} className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--desk-muted)]">{section.description}</p>
            <ul className="mt-5 divide-y divide-[var(--desk-line)]">
              {section.items.map((item) => (
                <PreferenceRow
                  key={item.key}
                  prefKey={item.key}
                  label={item.label}
                  description={item.description}
                  checked={preferences[item.key]}
                  saving={savingKeys.has(item.key)}
                  onChange={(value) => void setPreference(item.key, value)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

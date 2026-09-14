import { AlertCircle, CheckCircle2, CircleDot, Loader2 } from 'lucide-react'
import { StatusPill } from './StatusPill'

export type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

const STATES = {
  saved: { tone: 'success', icon: CheckCircle2, label: 'All changes saved' },
  unsaved: { tone: 'gold', icon: CircleDot, label: 'Unsaved changes' },
  saving: { tone: 'gold', icon: Loader2, label: 'Saving changes...' },
  error: { tone: 'danger', icon: AlertCircle, label: 'Changes not saved' },
} as const

export default function SaveStatus({ state }: { state: SaveState }) {
  const { tone, icon, label } = STATES[state]
  return (
    <span aria-live="polite" aria-atomic="true">
      <StatusPill tone={tone} icon={icon} className={state === 'saving' ? '[&>svg]:animate-spin' : undefined}>
        {label}
      </StatusPill>
    </span>
  )
}

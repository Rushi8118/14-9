import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Globe2, Loader2, LogOut, Monitor, MonitorSmartphone, Smartphone, Tablet } from 'lucide-react'
import { useMySessions } from '@/hooks/useMySessions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import InlineError from './InlineError'
import { SkeletonTable } from './SkeletonCard'
import { StatusPill } from './StatusPill'

function describeDevice(userAgent: string) {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Browser'
  const os = /iPhone/.test(userAgent)
    ? 'iPhone'
    : /iPad/.test(userAgent)
      ? 'iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /Mac OS X/.test(userAgent)
            ? 'macOS'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : 'this device'
  const kind = /iPad|Tablet/.test(userAgent) ? 'tablet' : /Mobi|iPhone|Android/.test(userAgent) ? 'mobile' : 'desktop'
  return { browser, os, kind }
}

function DeviceIcon({ kind }: { kind: string | null }) {
  const Icon = kind === 'mobile' ? Smartphone : kind === 'tablet' ? Tablet : Monitor
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-surface-soft)] text-[var(--desk-navy)]">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  )
}

export default function ActiveSessionsCard() {
  const { sessions, isLoading, isError, refetch, signOutOthers, signOutOthersLoading } = useMySessions()
  const [showAll, setShowAll] = useState(false)
  const current = useMemo(() => describeDevice(navigator.userAgent), [])
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const visible = showAll ? sessions : sessions.slice(0, 2)

  return (
    <section aria-labelledby="sessions-heading" className="desk-card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--desk-gold)]/12 text-[#8a6a1a]">
          <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="sessions-heading" className="desk-display text-xl font-semibold text-[var(--desk-navy)]">
            Active sessions
          </h2>
          <p className="mt-0.5 text-sm text-[var(--desk-muted)]">Devices where your account has been used.</p>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
          <DeviceIcon kind={current.kind} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--desk-success)]">Current session</p>
            <p className="truncate text-sm font-semibold text-[var(--desk-navy)]">
              {current.browser} on {current.os}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-[var(--desk-muted)]">
              <Globe2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              {timeZone.replace(/_/g, ' ')}
            </p>
          </div>
          <StatusPill tone="success">Active now</StatusPill>
        </div>

        {isLoading ? (
          <SkeletonTable rows={2} />
        ) : isError ? (
          <InlineError title="We could not load your session history." onRetry={() => void refetch()} />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--desk-muted)]">No other recorded sessions.</p>
        ) : (
          <ul id="session-history" className="space-y-2" aria-label="Recorded sessions">
            {visible.map((session) => (
              <li key={session.id} className="flex items-center gap-3 rounded-xl border border-[var(--desk-line)] p-3">
                <DeviceIcon kind={session.device_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--desk-navy)]">
                    {session.browser ?? 'Unknown browser'} on {session.os ?? 'unknown device'}
                  </p>
                  <p className="truncate text-xs text-[var(--desk-muted)]">{session.location ?? 'Location unavailable'}</p>
                </div>
                <span className="shrink-0 text-right text-xs text-[var(--desk-muted)]">
                  {session.is_active
                    ? `Last active ${formatDistanceToNow(new Date(session.last_seen), { addSuffix: true })}`
                    : 'Signed out'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {sessions.length > 2 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            aria-controls="session-history"
            className="min-h-11 rounded-full border-[var(--desk-line)] text-[var(--desk-navy)]"
          >
            {showAll ? 'Show fewer sessions' : 'View all sessions'}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={signOutOthersLoading}
              className="min-h-11 rounded-full border-red-200 text-[var(--desk-danger)] hover:bg-red-50 hover:text-[var(--desk-danger)]"
            >
              {signOutOthersLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Sign out other sessions
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="applicant-desk rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="desk-display text-xl">Sign out other sessions?</AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--desk-muted)]">
                Every other browser and device will be signed out. You stay signed in here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11 rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => signOutOthers()}
                className="min-h-11 rounded-full bg-[var(--desk-danger)] text-white hover:bg-[#912018]"
              >
                Sign out other sessions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  )
}

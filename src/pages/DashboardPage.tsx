import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { CalendarPlus, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useApplications } from '@/hooks/useApplications'
import { useAppointments } from '@/hooks/useAppointments'
import { useChat } from '@/hooks/useChat'
import { useConsultations } from '@/hooks/useConsultations'
import { useDocuments } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ActiveApplicationsCard from '@/components/dashboard/ActiveApplicationsCard'
import ConsultationBookingDialog from '@/components/dashboard/ConsultationBookingDialog'
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions'
import DashboardWelcomeCard from '@/components/dashboard/DashboardWelcomeCard'
import MissingDocumentsCard from '@/components/dashboard/MissingDocumentsCard'
import PageHeader, { Reveal } from '@/components/dashboard/PageHeader'
import ProfileCompletionCard from '@/components/dashboard/ProfileCompletionCard'
import RecentActivityTimeline, { buildRecentActivity } from '@/components/dashboard/RecentActivityTimeline'
import UpcomingDeadlinesCard from '@/components/dashboard/UpcomingDeadlinesCard'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { getProfileCompletion } from '@/components/dashboard/dashboard-utils'

function useSyncedLabel(syncedAt: Date) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return Date.now() - syncedAt.getTime() < 60_000 ? 'just now' : formatDistanceToNow(syncedAt, { addSuffix: true })
}

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const applications = useApplications()
  const documents = useDocuments()
  const appointments = useAppointments()
  const consultations = useConsultations()
  const { messages, isLoading: messagesLoading } = useChat()

  const [bookingOpen, setBookingOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const syncedLabel = useSyncedLabel(syncedAt)

  // The command palette links here with ?book=1 to open the booking dialog.
  useEffect(() => {
    if (searchParams.get('book') !== '1') return
    setBookingOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const activity = useMemo(
    () =>
      user
        ? buildRecentActivity({
            userId: user.id,
            profile,
            applications: applications.applications,
            consultations: consultations.consultations,
            appointments: appointments.appointments,
            documents: documents.documents,
            messages,
          })
        : [],
    [user, profile, applications.applications, consultations.consultations, appointments.appointments, documents.documents, messages],
  )

  if (!user) return null

  const fullName = profile?.full_name || user.email || 'Applicant'
  const accountActive = !profile || profile.status === 'active'
  const completion = getProfileCompletion(profile).percent

  const refreshAll = async () => {
    if (refreshing) return
    setRefreshing(true)
    const results = await Promise.all([
      applications.refetch(),
      documents.refetch(),
      appointments.refetch(),
      consultations.refetch(),
    ])
    setRefreshing(false)
    if (results.some((result) => result.isError)) {
      toast.error('We could not refresh your dashboard.', { description: 'Please check your connection and try again.' })
      return
    }
    setSyncedAt(new Date())
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await signOut()
    navigate('/')
  }

  return (
    <>
      <Helmet>
        <title>Applicant Dashboard | Siddhivinayak Overseas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6 pb-10 lg:space-y-8">
        <PageHeader
          title="Applicant Dashboard"
          description={
            <>
              Welcome back, <span className="font-semibold text-[var(--desk-navy)]">{fullName}</span>. Manage your global
              pathways in one place.
            </>
          }
          meta={
            <>
              <StatusPill tone={accountActive ? 'success' : 'warning'} icon={ShieldCheck}>
                {accountActive ? 'Account active' : 'Account restricted'}
              </StatusPill>
              <span aria-live="polite">
                <StatusPill tone="neutral" icon={RefreshCw}>
                  {refreshing ? 'Syncing…' : `Last synced ${syncedLabel}`}
                </StatusPill>
              </span>
            </>
          }
          actions={
            <>
              <Button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="min-h-11 flex-1 rounded-full bg-[var(--desk-navy)] px-5 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)] sm:flex-none"
              >
                <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Book consultation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={refreshAll}
                disabled={refreshing}
                className="min-h-11 rounded-full border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]"
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
                {refreshing ? 'Refreshing…' : 'Refresh data'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                disabled={signingOut}
                className="min-h-11 rounded-full text-[var(--desk-muted)] hover:bg-red-50 hover:text-[var(--desk-danger)]"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </>
          }
        />

        <Reveal>
          <DashboardWelcomeCard
            fullName={fullName}
            avatarUrl={profile?.profile_photo_url}
            accountActive={accountActive}
            completion={completion}
            onBook={() => setBookingOpen(true)}
          />
        </Reveal>

        <Reveal delay={0.05}>
          <DashboardKpiCards applications={applications.applications} isLoading={applications.isLoading} />
        </Reveal>

        <Reveal delay={0.1}>
          <DashboardQuickActions />
        </Reveal>

        <Reveal delay={0.15} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ProfileCompletionCard profile={profile} />
          <MissingDocumentsCard
            documents={documents.documents}
            isLoading={documents.isLoading}
            isError={documents.isError}
            onRetry={() => void documents.refetch()}
          />
          <div className="md:col-span-2 xl:col-span-1">
            <UpcomingDeadlinesCard
              appointments={appointments.appointments}
              consultations={consultations.consultations}
              isLoading={appointments.isLoading || consultations.isLoading}
            />
          </div>
        </Reveal>

        <Reveal delay={0.2} className="grid gap-6 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <ActiveApplicationsCard
              applications={applications.applications}
              isLoading={applications.isLoading}
              isError={applications.isError}
              isRefreshing={refreshing}
              onRefresh={refreshAll}
              onBook={() => setBookingOpen(true)}
            />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <RecentActivityTimeline
              items={activity}
              isLoading={applications.isLoading || documents.isLoading || messagesLoading}
            />
          </div>
        </Reveal>
      </div>

      <ConsultationBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onSubmit={consultations.createConsultation}
        isSubmitting={consultations.createLoading}
      />
    </>
  )
}

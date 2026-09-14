import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Clock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import ActiveSessionsCard from '@/components/dashboard/ActiveSessionsCard'
import DangerZoneCard from '@/components/dashboard/DangerZoneCard'
import NotificationPreferences from '@/components/dashboard/NotificationPreferences'
import PageHeader, { Reveal } from '@/components/dashboard/PageHeader'
import PasswordSecurityCard from '@/components/dashboard/PasswordSecurityCard'
import PersonalInformationForm from '@/components/dashboard/PersonalInformationForm'
import ProfileSummaryCard from '@/components/dashboard/ProfileSummaryCard'
import ProfileTabs, { PROFILE_TABS, type ProfileTab } from '@/components/dashboard/ProfileTabs'
import SaveStatus, { type SaveState } from '@/components/dashboard/SaveStatus'
import TwoFactorCard from '@/components/dashboard/TwoFactorCard'
import { StatusPill } from '@/components/dashboard/StatusPill'
import { formatDate } from '@/components/dashboard/dashboard-utils'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [saveState, setSaveState] = useState<SaveState>('saved')

  const requested = searchParams.get('tab')
  const tab: ProfileTab = PROFILE_TABS.some((t) => t.value === requested) ? (requested as ProfileTab) : 'personal'

  const setTab = (next: ProfileTab) => setSearchParams(next === 'personal' ? {} : { tab: next }, { replace: true })

  const handleEdit = () => {
    setTab('personal')
    window.setTimeout(() => {
      const field = document.getElementById('profile-full_name')
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      field?.focus({ preventScroll: true })
    }, 60)
  }

  if (!user) return null

  const active = !profile || profile.status === 'active'

  return (
    <>
      <Helmet>
        <title>Profile settings | Siddhivinayak Overseas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6 pb-10">
        <PageHeader
          title="Profile settings"
          description="Manage your personal information, security preferences and account controls."
          meta={
            <>
              <StatusPill tone={active ? 'success' : 'warning'} icon={ShieldCheck}>
                {active ? 'Account active' : 'Account restricted'}
              </StatusPill>
              {profile?.updated_at && (
                <StatusPill tone="neutral" icon={Clock}>
                  Last updated {formatDate(profile.updated_at)}
                </StatusPill>
              )}
              <SaveStatus state={saveState} />
            </>
          }
        />

        <Reveal>
          <ProfileSummaryCard onEdit={handleEdit} />
        </Reveal>

        <Reveal delay={0.05}>
          <ProfileTabs
            value={tab}
            onValueChange={setTab}
            panels={{
              personal: <PersonalInformationForm onStateChange={setSaveState} />,
              security: (
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="xl:col-span-2">
                    <PasswordSecurityCard />
                  </div>
                  <TwoFactorCard />
                  <ActiveSessionsCard />
                </div>
              ),
              notifications: <NotificationPreferences />,
              danger: <DangerZoneCard />,
            }}
          />
        </Reveal>
      </div>
    </>
  )
}

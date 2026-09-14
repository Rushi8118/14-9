import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BellRing, LockKeyhole, TriangleAlert, UserRound, type LucideIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type ProfileTab = 'personal' | 'security' | 'notifications' | 'danger'

export const PROFILE_TABS: { value: ProfileTab; label: string; icon: LucideIcon }[] = [
  { value: 'personal', label: 'Personal information', icon: UserRound },
  { value: 'security', label: 'Security', icon: LockKeyhole },
  { value: 'notifications', label: 'Notifications', icon: BellRing },
  { value: 'danger', label: 'Danger zone', icon: TriangleAlert },
]

export default function ProfileTabs({
  value,
  onValueChange,
  panels,
}: {
  value: ProfileTab
  onValueChange: (value: ProfileTab) => void
  panels: Record<ProfileTab, ReactNode>
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as ProfileTab)} className="gap-0">
      <TabsList
        aria-label="Profile sections"
        className="desk-scroll-x h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[var(--desk-line)] bg-transparent p-0"
      >
        {PROFILE_TABS.map(({ value: tab, label, icon: Icon }) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className={cn(
              'h-auto min-h-11 flex-none shrink-0 gap-2 rounded-none rounded-t-lg border-0 border-b-2 border-transparent px-4 text-sm font-medium text-[var(--desk-muted)] shadow-none hover:text-[var(--desk-navy)] data-[state=active]:border-[var(--desk-gold)] data-[state=active]:bg-[var(--desk-gold)]/10 data-[state=active]:text-[#7a5c12] data-[state=active]:shadow-none',
              tab === 'danger' &&
                'hover:text-[var(--desk-danger)] data-[state=active]:border-[var(--desk-danger)] data-[state=active]:bg-red-50 data-[state=active]:text-[var(--desk-danger)]',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {PROFILE_TABS.map(({ value: tab }) => (
        // forceMount keeps unsaved form edits when switching tabs.
        <TabsContent key={tab} value={tab} forceMount className="mt-6 outline-none data-[state=inactive]:hidden">
          <motion.div
            initial={false}
            animate={value === tab ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {panels[tab]}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

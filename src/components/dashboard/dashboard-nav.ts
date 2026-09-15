import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Files,
  Home,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'
import type { usePermissions } from '@/hooks/usePermissions'

export type DashboardNavItem = {
  label: string
  path: string
  icon: LucideIcon
  description: string
}

export type DashboardNavGroup = { label: string; items: DashboardNavItem[] }

type Access = { can: ReturnType<typeof usePermissions>['can']; canAccessAdmin: boolean }

export function getDashboardNavGroups({ can, canAccessAdmin }: Access): DashboardNavGroup[] {
  const workspace: DashboardNavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, description: 'Your applicant command centre' },
  ]
  if (can('applications.read')) {
    workspace.push({
      label: 'Applications',
      path: '/dashboard/applications',
      icon: BriefcaseBusiness,
      description: 'Track visa pathways',
    })
  }
  if (can('documents.read')) {
    workspace.push({ label: 'Documents', path: '/dashboard/documents', icon: Files, description: 'Upload and review files' })
  }
  if (can('appointments.read')) {
    workspace.push({
      label: 'Appointments',
      path: '/dashboard/appointments',
      icon: CalendarDays,
      description: 'Consultations and sessions',
    })
  }

  const account: DashboardNavItem[] = [
    {
      label: 'Profile Settings',
      path: '/dashboard/profile',
      icon: UserRoundCog,
      description: 'Personal details and security',
    },
  ]
  if (canAccessAdmin) {
    account.push({ label: 'Admin Panel', path: '/admin', icon: ShieldCheck, description: 'Staff administration' })
  }

  return [
    { label: 'Workspace', items: workspace },
    {
      label: 'Support',
      items: [
        { label: 'Officer Chat', path: '/dashboard/chat', icon: MessageCircle, description: 'Message your case officer' },
        { label: 'Notifications', path: '/dashboard/notifications', icon: Bell, description: 'Updates and alerts' },
      ],
    },
    {
      label: 'Website',
      items: [{ label: 'Home Page', path: '/', icon: Home, description: 'Back to the main website' }],
    },
    // Account stays last: the sidebar renders Sign Out at the end of this group.
    { label: 'Account', items: account },
  ]
}

export function isNavItemActive(pathname: string, path: string) {
  const current = pathname.replace(/\/+$/, '') || '/'
  return path === '/dashboard' ? current === '/dashboard' : current === path || current.startsWith(`${path}/`)
}

export const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/applications': 'Applications',
  '/dashboard/documents': 'Documents',
  '/dashboard/appointments': 'Appointments',
  '/dashboard/chat': 'Officer chat',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/profile': 'Profile settings',
}

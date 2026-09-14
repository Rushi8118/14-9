/** Prefetch lazy route modules on hover/focus so navigation feels instant. */

const loaders: Record<string, () => Promise<unknown>> = {
  '/contact': () => import('@/pages/ContactPage'),
  '/services': () => import('@/pages/ServicesPage'),
  '/countries': () => import('@/pages/CountriesPage'),
  '/reviews': () => import('@/pages/ReviewsPage'),
  '/success-stories': () => import('@/pages/SuccessStoriesPage'),
  '/post-study-work-visa': () => import('@/pages/PostStudyWorkVisaPage'),
  '/study-in-germany': () => import('@/pages/StudyInGermanyPage'),
  '/study-in-france': () => import('@/pages/StudyInFrancePage'),
  '/study-in-spain': () => import('@/pages/StudyInSpainPage'),
  '/study-in-dubai': () => import('@/pages/StudyInDubaiPage'),
  '/study-in-singapore': () => import('@/pages/StudyInSingaporePage'),
  '/study-in-ireland': () => import('@/pages/StudyInIrelandPage'),
  '/study-in-new-zealand': () => import('@/pages/StudyInNewZealandPage'),
  '/work-visa/japan': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/germany': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/canada': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/uk': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/australia': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/singapore': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/work-visa/gulf': () => import('@/pages/work-visa/WorkVisaCountryPage'),
  '/login': () => import('@/pages/LoginPage'),
  '/register': () => import('@/pages/RegisterPage'),
}

const warmed = new Set<string>()

export function prefetchRoute(path: string) {
  const key = path.split('?')[0]
  if (warmed.has(key)) return
  const loader = loaders[key]
  if (!loader) return
  warmed.add(key)
  void loader().catch(() => {
    warmed.delete(key)
  })
}

const workspaceLoaders: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('@/pages/AdminDashboard'),
  '/admin/realtime': () => import('@/pages/admin/RealtimeDashboardPage'),
  '/admin/users': () => import('@/pages/admin/UsersPage'),
  '/admin/roles': () => import('@/pages/admin/RolesPage'),
  '/admin/applications': () => import('@/pages/admin/AdminApplicationsWorkspace'),
  '/admin/urgent-requirements': () => import('@/pages/admin/UrgentRequirementsAdminPage'),
  '/admin/countries': () => import('@/pages/admin/CountriesAdminPage'),
  '/admin/blog': () => import('@/pages/admin/BlogPage'),
  '/admin/sessions': () => import('@/pages/admin/SessionsPage'),
  '/admin/audit': () => import('@/pages/admin/AuditLogsPage'),
  '/admin/automations': () => import('@/pages/admin/AutomationsPage'),
  '/admin/email-templates': () => import('@/pages/admin/EmailTemplatesPage'),
  '/admin/files': () => import('@/pages/admin/FileManagerPage'),
  '/admin/settings': () => import('@/pages/admin/SettingsPage'),
  '/dashboard': () => import('@/pages/DashboardPage'),
  '/dashboard/applications': () => import('@/pages/ApplicationsPage'),
  '/dashboard/documents': () => import('@/pages/DocumentsPage'),
  '/dashboard/appointments': () => import('@/pages/AppointmentsPage'),
  '/dashboard/chat': () => import('@/pages/ChatPage'),
  '/dashboard/notifications': () => import('@/pages/NotificationsPage'),
  '/dashboard/profile': () => import('@/pages/ProfilePage'),
}
Object.assign(loaders, workspaceLoaders)

/**
 * Once a workspace layout is on screen, download its sibling pages in the background
 * (one at a time, while the browser is idle) so switching pages never waits on the network.
 */
export function warmRoutesWhenIdle(prefix: '/admin' | '/dashboard') {
  const queue = Object.keys(workspaceLoaders).filter((path) => path.startsWith(prefix) && !warmed.has(path))
  const idle: (cb: () => void) => number =
    'requestIdleCallback' in window
      ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => window.setTimeout(cb, 300)
  let cancelled = false
  const next = () => {
    const path = queue.shift()
    if (cancelled || !path) return
    warmed.add(path)
    void workspaceLoaders[path]()
      .catch(() => warmed.delete(path))
      .finally(() => idle(next))
  }
  const timer = window.setTimeout(() => idle(next), 1200)
  return () => {
    cancelled = true
    window.clearTimeout(timer)
  }
}

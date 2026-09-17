import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

/**
 * Logs page views for the admin access dashboard. Administrator activity is stored in a
 * separate admin log, so it never mixes with public visitor activity.
 */
export function SiteVisitTracker() {
  const location = useLocation()
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    void import('@/lib/activity-logger').then(({ logNavigation }) => logNavigation(`${location.pathname}${location.search}`, document.title))
    void import('@/lib/site-visit-tracker').then(({ trackSiteEvent }) => {
      void trackSiteEvent({
        eventType: 'page_view',
        path: `${location.pathname}${location.search}`,
        title: document.title,
        userId: user?.id ?? null,
        admin: isAdmin,
      })
    })
  }, [location.pathname, location.search, user?.id, isAdmin])

  return null
}

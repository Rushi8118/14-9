import React, { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Check, Clipboard, Info, CalendarRange, Landmark } from 'lucide-react'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const defaultNotificationPath = isAdmin ? '/admin/notifications' : '/dashboard/notifications'

  const toggleDropdown = () => setIsOpen((prev) => !prev)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'application_update':
        return <Clipboard className="h-4 w-4 text-[#E8B84B]" aria-hidden="true" />
      case 'consultation_reminder':
        return <CalendarRange className="h-4 w-4 text-emerald-400" aria-hidden="true" />
      case 'payment_due':
        return <Landmark className="h-4 w-4 text-rose-400" aria-hidden="true" />
      case 'document_request':
        return <Clipboard className="h-4 w-4 text-[#E8B84B]" aria-hidden="true" />
      case 'promotion':
        return <Info className="h-4 w-4 text-sky-400" aria-hidden="true" />
      default:
        return <Bell className="h-4 w-4 text-[#E8B84B]" aria-hidden="true" />
    }
  }

  const lastFive = notifications.slice(0, 5)

  const handleItemClick = (notif: Notification) => {
    markAsRead(notif.id)
    setIsOpen(false)
    if (notif.action_url) {
      navigate(notif.action_url)
    } else {
      navigate(defaultNotificationPath)
    }
  }

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`relative p-2.5 min-h-10 min-w-10 text-[#1A2340] dark:text-[#f1f5f9] hover:text-[#C49A2B] bg-[#FCFBF8]/90 dark:bg-[#0a0a0a] hover:bg-[#C49A2B]/10 dark:hover:bg-white/10 rounded-full border border-[#C49A2B]/25 dark:border-white/15 transition duration-200 ${focusRing}`}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications, no unread'
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[1.15rem] px-1 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-sm"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-3 w-[min(100vw-1.5rem,24rem)] sm:w-96 bg-[#0a0a0a] border border-white/15 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-xl z-50 overflow-hidden text-white"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#000000] text-[#FFF8E7] border-b border-white/10">
            <h3 className="font-serif text-sm font-semibold text-white tracking-wide">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className={`flex items-center gap-1 min-h-9 px-2 text-xs text-[#E8B84B] hover:text-[#FFF8E7] font-medium transition rounded-md ${focusRing} focus-visible:ring-offset-[#000000]`}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,300px)] overflow-y-auto divide-y divide-white/10">
            {lastFive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-slate-500 mb-2" aria-hidden="true" />
                <p className="text-sm text-slate-200 font-medium">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No recent notifications.</p>
              </div>
            ) : (
              lastFive.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleItemClick(notif)}
                  className={`w-full flex items-start gap-3 p-4 text-left cursor-pointer transition ${focusRing} focus-visible:ring-inset ${
                    !notif.is_read
                      ? 'bg-[#141414] hover:bg-[#1a1a1a] border-l-2 border-[#E8B84B]'
                      : 'border-l-2 border-transparent hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-full bg-white/10 shrink-0" aria-hidden="true">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4
                      className={`text-sm text-white line-clamp-1 ${
                        !notif.is_read ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      {notif.title}
                      {!notif.is_read && <span className="sr-only"> (unread)</span>}
                    </h4>
                    {notif.message && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{notif.message}</p>
                    )}
                    <time
                      className="text-[11px] text-slate-400 block"
                      dateTime={notif.created_at}
                    >
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </time>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              navigate(defaultNotificationPath)
            }}
            className={`block w-full text-center py-3 min-h-11 bg-[#000000] hover:bg-[#141414] text-sm font-semibold text-[#E8B84B] hover:text-[#f3cf7a] border-t border-white/10 transition ${focusRing}`}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

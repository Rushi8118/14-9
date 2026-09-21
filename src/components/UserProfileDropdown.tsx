import React, { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import UserAvatar from './UserAvatar'
import {
  User,
  Briefcase,
  FileText,
  Calendar,
  Bell,
  LogOut,
  ChevronDown,
  Shield,
  ChevronRight,
} from 'lucide-react'

export default function UserProfileDropdown() {
  const { user, profile, signOut, canAccessAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

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

  if (!user) return null

  const displayName = profile?.first_name
    ? profile.first_name
    : profile?.full_name
      ? profile.full_name.split(' ')[0]
      : 'User'

  const handleLogout = async () => {
    setIsOpen(false)
    await signOut()
    navigate('/')
  }

  const go = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  const menuItems = [
    { label: 'My Profile', path: '/dashboard/profile', icon: User },
    { label: 'My Applications', path: '/dashboard/applications', icon: Briefcase },
    { label: 'My Documents', path: '/dashboard/documents', icon: FileText },
    { label: 'My Appointments', path: '/dashboard/appointments', icon: Calendar },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  ]

  const itemFocus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 p-1 sm:pl-1 sm:pr-2.5 min-h-10 rounded-full border border-[#C49A2B]/25 dark:border-[rgba(255,255,255,0.12)] bg-[#FCFBF8]/90 dark:bg-[#111726]/90 hover:border-[#C49A2B]/45 hover:bg-[#C49A2B]/8 transition duration-200 select-none group ${itemFocus}`}
        aria-label={`Account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
      >
        <UserAvatar
          imageUrl={profile?.profile_photo_url}
          fullName={profile?.full_name || user.email}
          size="sm"
        />
        <div className="hidden sm:flex flex-col items-start text-left pr-0.5">
          <span className="text-xs font-semibold text-[#1A2340] dark:text-[#f1f5f9] group-hover:text-[#C49A2B] transition-colors leading-none">
            Hi, {displayName}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#1A2340]/55 dark:text-[#94a3b8] group-hover:text-[#C49A2B] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-3 w-[17.5rem] z-50 overflow-hidden rounded-2xl border border-[#C49A2B]/20 dark:border-[rgba(255,255,255,0.12)] bg-[#FCFBF8]/97 dark:bg-[#111726]/98 shadow-[0_18px_40px_-18px_rgba(26,35,64,0.45)] backdrop-blur-xl"
        >
          {/* Identity */}
          <div className="relative overflow-hidden border-b border-[#C49A2B]/15 bg-gradient-to-br from-[#1A2340] to-[#2a3555] px-4 py-3.5 text-[#FFF8E7]">
            <div
              className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-[#C49A2B]/20"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
              <UserAvatar
                imageUrl={profile?.profile_photo_url}
                fullName={profile?.full_name || user.email}
                size="md"
                className="ring-2 ring-[#C49A2B]/45"
              />
              <div className="min-w-0">
                <p className="font-serif text-sm font-semibold truncate">
                  {profile?.full_name || 'Applicant Account'}
                </p>
                <p className="text-[11px] text-[#FFF8E7]/75 truncate mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Admin — refined chip, not a solid yellow block */}
          {canAccessAdmin && (
            <div className="p-2 border-b border-[#E0D8C8]/80 dark:border-white/10">
              <button
                type="button"
                role="menuitem"
                onClick={() => go('/admin')}
                className={`w-full flex items-center justify-between gap-2 rounded-xl border border-[#C49A2B]/30 bg-[#C49A2B]/8 hover:bg-[#C49A2B]/15 px-3 py-2.5 min-h-11 text-left transition ${itemFocus}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A2340] text-[#C49A2B]" aria-hidden="true">
                    <Shield className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-[#1A2340] dark:text-[#f1f5f9]">Admin Panel</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#C49A2B]" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="p-1.5 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => go(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-10 rounded-xl text-sm font-medium text-[#1A2340]/80 dark:text-[#cbd5e1] hover:text-[#1A2340] dark:hover:text-white hover:bg-[#C49A2B]/10 transition text-left ${itemFocus}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#C49A2B]" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="border-t border-[#E0D8C8] dark:border-white/10 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-10 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left ${itemFocus}`}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

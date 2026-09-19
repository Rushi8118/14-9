import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clipboard,
  CalendarRange,
  FileText,
  Info,
  Landmark,
  Layers,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { subscribePostgresChanges } from '@/lib/supabase/realtime'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type AdminNotification = {
  id: string
  user_id: string
  type: 'general' | 'application_update' | 'consultation_reminder' | 'document_request' | 'payment_due' | 'promotion'
  title: string
  message: string | null
  action_url: string | null
  action_label: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  recipient_name?: string | null
  recipient_email?: string | null
  recipient_role?: string | null
}

type FilterTab = 'all' | 'unread' | 'general' | 'application_update' | 'consultation_reminder' | 'document_request' | 'payment_due'

const TABS: { id: FilterTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Alerts', icon: Layers },
  { id: 'unread', label: 'Unread', icon: BellRing },
  { id: 'general', label: 'Announcements', icon: Megaphone },
  { id: 'application_update', label: 'Applications', icon: Clipboard },
  { id: 'consultation_reminder', label: 'Appointments', icon: CalendarRange },
  { id: 'document_request', label: 'Documents', icon: FileText },
  { id: 'payment_due', label: 'Payments', icon: Landmark },
]

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeBg: string; textCol: string; borderCol: string }
> = {
  general: {
    label: 'Announcement',
    icon: Megaphone,
    badgeBg: 'bg-amber-500/15',
    textCol: 'text-amber-800',
    borderCol: 'border-amber-300/80',
  },
  application_update: {
    label: 'Application',
    icon: Clipboard,
    badgeBg: 'bg-purple-500/15',
    textCol: 'text-purple-800',
    borderCol: 'border-purple-300/80',
  },
  consultation_reminder: {
    label: 'Appointment',
    icon: CalendarRange,
    badgeBg: 'bg-emerald-500/15',
    textCol: 'text-emerald-800',
    borderCol: 'border-emerald-300/80',
  },
  document_request: {
    label: 'Document Request',
    icon: FileText,
    badgeBg: 'bg-blue-500/15',
    textCol: 'text-blue-800',
    borderCol: 'border-blue-300/80',
  },
  payment_due: {
    label: 'Payment Due',
    icon: Landmark,
    badgeBg: 'bg-red-500/15',
    textCol: 'text-red-800',
    borderCol: 'border-red-300/80',
  },
  promotion: {
    label: 'Promotion',
    icon: Info,
    badgeBg: 'bg-teal-500/15',
    textCol: 'text-teal-800',
    borderCol: 'border-teal-300/80',
  },
}

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isSendOpen, setIsSendOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminNotification | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Send form state
  const [sendTarget, setSendTarget] = useState<'all' | 'customers' | 'staff' | 'user'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [sendType, setSendType] = useState<AdminNotification['type']>('general')
  const [sendTitle, setSendTitle] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendActionUrl, setSendActionUrl] = useState('')
  const [sendActionLabel, setSendActionLabel] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  // Fetch users for target selection
  const { data: userOptions = [] } = useQuery({
    queryKey: ['admin-notification-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, user_role')
        .order('full_name')
        .limit(300)
      if (error) return []
      return data || []
    },
    enabled: isSendOpen,
  })

  // Fetch notifications
  const queryKey = ['admin-notifications-list', activeTab, search]
  const {
    data = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<AdminNotification[]>({
    queryKey,
    queryFn: async () => {
      // 1. Attempt admin RPC first for enriched data with recipient profiles
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_notifications', {
        p_type: activeTab === 'all' || activeTab === 'unread' ? null : activeTab,
        p_unread_only: activeTab === 'unread',
        p_search: search || null,
        p_limit: 250,
      })

      if (!rpcErr && Array.isArray(rpcData)) {
        return rpcData as AdminNotification[]
      }

      // 2. Fallback to direct table query
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (activeTab === 'unread') {
        query = query.eq('is_read', false)
      } else if (activeTab !== 'all') {
        query = query.eq('type', activeTab)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
      }

      const { data: rows, error: directErr } = await query
      if (directErr) {
        throw directErr
      }
      return (rows ?? []) as AdminNotification[]
    },
    refetchInterval: 45_000,
  })

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribePostgresChanges(
      supabase,
      'admin-notifications-feed',
      { table: 'notifications' },
      () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] })
      },
    )
    return unsub
  }, [queryClient])

  // Statistics calculation
  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    return {
      total: data.length,
      unread: data.filter((n) => !n.is_read).length,
      announcements: data.filter((n) => n.type === 'general').length,
      today: data.filter((n) => new Date(n.created_at).getTime() >= startOfToday).length,
    }
  }, [data])

  // Toggle read/unread status
  const handleToggleRead = async (notif: AdminNotification) => {
    try {
      const nextRead = !notif.is_read
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: nextRead,
          read_at: nextRead ? new Date().toISOString() : null,
        })
        .eq('id', notif.id)

      if (error) throw error
      toast.success(nextRead ? 'Marked as read' : 'Marked as unread')
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      if (!user) return
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      toast.success('All notifications marked as read')
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }

  // Delete notification
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      // Try admin RPC first
      const { error: rpcErr } = await supabase.rpc('admin_delete_notification', {
        p_id: deleteTarget.id,
      })

      if (rpcErr) {
        // Fallback to direct delete
        const { error: directErr } = await supabase
          .from('notifications')
          .delete()
          .eq('id', deleteTarget.id)

        if (directErr) throw directErr
      }

      toast.success('Notification deleted')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }

  // Send / Broadcast notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendTitle.trim()) {
      toast.error('Please enter a notification title')
      return
    }

    if (sendTarget === 'user' && !selectedUserId) {
      toast.error('Please select a recipient')
      return
    }

    setIsSending(true)
    try {
      // 1. Try RPC first
      const { data: count, error: rpcErr } = await supabase.rpc('admin_send_notification', {
        p_target: sendTarget,
        p_target_id: sendTarget === 'user' ? selectedUserId : null,
        p_type: sendType,
        p_title: sendTitle.trim(),
        p_message: sendMessage.trim() || null,
        p_action_url: sendActionUrl.trim() || null,
        p_action_label: sendActionLabel.trim() || null,
      })

      if (!rpcErr) {
        toast.success(`Sent successfully! (${count || 1} recipient${count === 1 ? '' : 's'})`)
      } else {
        // Fallback: single user insert
        if (sendTarget === 'user' && selectedUserId) {
          const { error: insertErr } = await supabase.from('notifications').insert({
            user_id: selectedUserId,
            type: sendType,
            title: sendTitle.trim(),
            message: sendMessage.trim() || null,
            action_url: sendActionUrl.trim() || null,
            action_label: sendActionLabel.trim() || null,
          })
          if (insertErr) throw insertErr
          toast.success('Notification sent to user')
        } else if (user) {
          // If broadcast RPC is not installed yet, insert for current admin user
          const { error: insertErr } = await supabase.from('notifications').insert({
            user_id: user.id,
            type: sendType,
            title: sendTitle.trim(),
            message: sendMessage.trim() || null,
            action_url: sendActionUrl.trim() || null,
            action_label: sendActionLabel.trim() || null,
          })
          if (insertErr) throw insertErr
          toast.success('Notification created')
        }
      }

      setIsSendOpen(false)
      setSendTitle('')
      setSendMessage('')
      setSendActionUrl('')
      setSendActionLabel('')
      setSelectedUserId('')
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="desk-display flex items-center gap-2.5 text-2xl font-semibold text-[var(--desk-navy)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300/60 bg-amber-500/15 text-amber-700 shadow-2xs">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            Notifications & Broadcasts
          </h1>
          <p className="mt-1 text-sm text-[var(--desk-muted)]">
            Review system notifications, monitor delivery status, and broadcast alerts or announcements to applicants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>

          {stats.unread > 0 && (
            <Button
              variant="outline"
              onClick={() => void handleMarkAllRead()}
              className="gap-2 rounded-xl"
            >
              <CheckCheck className="h-4 w-4 text-[var(--desk-gold)]" aria-hidden="true" />
              Mark all read
            </Button>
          )}

          <Button
            onClick={() => setIsSendOpen(true)}
            className="gap-2 rounded-xl bg-gradient-to-r from-[var(--desk-gold)] to-amber-600 text-white shadow-sm hover:brightness-105"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Broadcast Notification
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Notifications',
            value: stats.total,
            desc: 'System-wide activity',
            icon: Bell,
            color: 'from-indigo-500/15 to-blue-500/10 text-indigo-700 border-indigo-200/60',
          },
          {
            label: 'Unread Alerts',
            value: stats.unread,
            desc: 'Pending acknowledgement',
            icon: BellRing,
            color: 'from-amber-500/15 to-yellow-500/10 text-amber-800 border-amber-200/60',
          },
          {
            label: 'Delivered Today',
            value: stats.today,
            desc: 'Created in last 24h',
            icon: Send,
            color: 'from-emerald-500/15 to-teal-500/10 text-emerald-800 border-emerald-200/60',
          },
          {
            label: 'Announcements',
            value: stats.announcements,
            desc: 'Broadcasts & general notes',
            icon: Megaphone,
            color: 'from-purple-500/15 to-pink-500/10 text-purple-800 border-purple-200/60',
          },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <div
              key={stat.label}
              className="desk-panel relative overflow-hidden rounded-2xl border border-[var(--desk-line)] p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--desk-muted)]">{stat.label}</p>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-gradient-to-br ${stat.color}`}
                >
                  <StatIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
              <p className="desk-display mt-2 text-2xl font-semibold text-[var(--desk-navy)]">{stat.value}</p>
              <p className="mt-1 text-[11px] text-[var(--desk-muted)]">{stat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter notifications" className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center gap-2 min-h-9 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'border-[var(--desk-gold)] bg-gradient-to-r from-[var(--desk-gold)]/20 to-[var(--desk-gold)]/10 text-[var(--desk-navy)] shadow-xs ring-1 ring-[var(--desk-gold)]/30'
                    : 'border-[var(--desk-line)] bg-white/60 text-[var(--desk-muted)] hover:bg-white hover:text-[var(--desk-navy)] hover:border-[var(--desk-gold)]/30 hover:shadow-2xs'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 group-hover:scale-110 ${
                    isSelected
                      ? 'bg-[var(--desk-gold)] text-[var(--desk-navy)] shadow-2xs'
                      : 'bg-black/[0.04] text-[var(--desk-muted)] group-hover:bg-[var(--desk-gold)]/15 group-hover:text-[var(--desk-navy)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desk-muted)]"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, message, user…"
            aria-label="Search notifications"
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--desk-muted)]">
          <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading notifications" />
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="desk-panel rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900"
        >
          Notifications could not be loaded. Please check your permissions or run the latest database migration.
          <Button variant="outline" size="sm" className="ml-3 rounded-lg" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="desk-panel rounded-2xl border border-[var(--desk-line)] p-12 text-center text-sm text-[var(--desk-muted)]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--desk-line)] bg-white/70 text-[var(--desk-muted)] shadow-2xs">
            <Bell className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="font-medium text-[var(--desk-navy)]">No notifications found</p>
          <p className="mt-1 text-xs">There are no notifications matching your selected filter or search query.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((notif) => {
            const typeConf = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general
            const TypeIcon = typeConf.icon

            return (
              <li
                key={notif.id}
                className={`desk-panel group rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-sm ${
                  !notif.is_read
                    ? 'border-[var(--desk-gold)]/40 bg-white/95 shadow-xs'
                    : 'border-[var(--desk-line)] bg-[var(--desk-surface)] hover:border-[var(--desk-gold)]/30'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Icon and details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-transform duration-200 group-hover:scale-105 ${typeConf.badgeBg} ${typeConf.textCol} ${typeConf.borderCol} shadow-2xs`}
                    >
                      <TypeIcon className="w-4 h-4" aria-hidden="true" />
                      {!notif.is_read && (
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"
                          title="Unread notification"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeConf.badgeBg} ${typeConf.textCol} ${typeConf.borderCol}`}
                        >
                          {typeConf.label}
                        </span>

                        {notif.recipient_name && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--desk-navy)] bg-black/[0.04] px-2 py-0.5 rounded-full">
                            <User className="h-3 w-3 text-[var(--desk-muted)]" />
                            {notif.recipient_name}
                          </span>
                        )}

                        <span className="text-[11px] text-[var(--desk-muted)]">
                          · {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <h3 className={`text-sm ${!notif.is_read ? 'font-bold text-[var(--desk-navy)]' : 'font-semibold text-[var(--desk-navy)]/90'}`}>
                        {notif.title}
                      </h3>

                      {notif.message && (
                        <p className="text-xs text-[var(--desk-navy)]/75 leading-relaxed">
                          {notif.message}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--desk-muted)]">
                        <time dateTime={notif.created_at}>
                          {format(new Date(notif.created_at), 'd MMM yyyy, h:mm a')}
                        </time>

                        {notif.action_url && (
                          <a
                            href={notif.action_url}
                            className="inline-flex items-center gap-1 text-[var(--desk-navy)] font-semibold hover:underline"
                          >
                            <span>{notif.action_label || 'View Link'}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick actions */}
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleToggleRead(notif)}
                      title={notif.is_read ? 'Mark as unread' : 'Mark as read'}
                      className="h-8 rounded-lg px-2.5 text-xs text-[var(--desk-muted)] hover:text-[var(--desk-navy)]"
                    >
                      <Check className={`h-3.5 w-3.5 mr-1 ${notif.is_read ? 'text-[var(--desk-gold)]' : 'text-gray-400'}`} />
                      {notif.is_read ? 'Read' : 'Mark read'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(notif)}
                      title="Delete notification"
                      className="h-8 rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Broadcast / Send Notification Modal */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="desk-display flex items-center gap-2 text-xl text-[var(--desk-navy)]">
              <Megaphone className="h-5 w-5 text-[var(--desk-gold)]" />
              Broadcast Notification
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--desk-muted)]">
              Send an alert or announcement to all applicants, staff members, or a specific registered user.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendNotification} className="space-y-4 pt-2">
            {/* Target Audience */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--desk-navy)]">Target Audience</label>
                <Select value={sendTarget} onValueChange={(val: 'all' | 'customers' | 'staff' | 'user') => setSendTarget(val)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active Users (Broadcast)</SelectItem>
                    <SelectItem value="customers">All Applicants / Customers</SelectItem>
                    <SelectItem value="staff">Staff & Case Officers</SelectItem>
                    <SelectItem value="user">Specific User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--desk-navy)]">Notification Type</label>
                <Select value={sendType} onValueChange={(val: AdminNotification['type']) => setSendType(val)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Announcement / General</SelectItem>
                    <SelectItem value="application_update">Application Update</SelectItem>
                    <SelectItem value="document_request">Document Request</SelectItem>
                    <SelectItem value="consultation_reminder">Appointment Reminder</SelectItem>
                    <SelectItem value="payment_due">Payment Due</SelectItem>
                    <SelectItem value="promotion">Promotional / Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* If Specific User selected */}
            {sendTarget === 'user' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--desk-navy)]">Select Recipient User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a registered user" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {userOptions.map((u: { id: string; full_name?: string | null; email?: string | null }) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || 'Unnamed'} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--desk-navy)]">Title</label>
              <Input
                value={sendTitle}
                onChange={(e) => setSendTitle(e.target.value)}
                placeholder="e.g. System Maintenance Notice or Visa Policy Update"
                required
                className="rounded-xl"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--desk-navy)]">Message</label>
              <Textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Enter the notification message details..."
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Action link (optional) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--desk-navy)]">Action Link URL (Optional)</label>
                <Input
                  value={sendActionUrl}
                  onChange={(e) => setSendActionUrl(e.target.value)}
                  placeholder="e.g. /dashboard/applications"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--desk-navy)]">Action Button Label (Optional)</label>
                <Input
                  value={sendActionLabel}
                  onChange={(e) => setSendActionLabel(e.target.value)}
                  placeholder="e.g. View Application"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-ivory)]/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">Live Preview</p>
              <div className="mt-2 flex items-start gap-3 rounded-lg bg-white p-3 shadow-2xs border border-black/5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--desk-navy)]">{sendTitle.trim() || 'Notification Title'}</p>
                  <p className="text-[11px] text-[var(--desk-navy)]/70 line-clamp-2 mt-0.5">
                    {sendMessage.trim() || 'Your message will appear here in the user notification centre.'}
                  </p>
                  {sendActionLabel && (
                    <span className="mt-1.5 inline-block text-[11px] font-semibold text-[var(--desk-gold)]">
                      {sendActionLabel} →
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSendOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSending}
                className="gap-2 rounded-xl bg-gradient-to-r from-[var(--desk-gold)] to-amber-600 text-white shadow-sm hover:brightness-105"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="desk-display text-[var(--desk-navy)]">Delete notification?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[var(--desk-muted)]">
              Are you sure you want to delete “{deleteTarget?.title}”? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

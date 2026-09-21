import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Phone,
  RefreshCw,
  Rows3,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES, getRoleBySlug } from '@/lib/rbac'
import { supabase } from '@/lib/supabase/client'
import { writeAuditLog } from '@/lib/audit-log'
import { cn } from '@/lib/utils'
import UserAvatar from '@/components/UserAvatar'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminUserProfileDialog } from '@/components/admin/AdminUserProfileDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PageHeader, { Reveal } from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
import InlineError from '@/components/dashboard/InlineError'
import PasswordStrengthMeter, { meetsPasswordRequirements } from '@/components/dashboard/PasswordStrengthMeter'
import { StatusPill, type PillTone } from '@/components/dashboard/StatusPill'
import { formatDate, humanize } from '@/components/dashboard/dashboard-utils'

type UserRow = {
  id: string
  full_name: string | null
  email: string
  user_role: string
  status: string
  phone: string | null
  profile_photo_url: string | null
  created_at: string
  last_login_at: string | null
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'deleted'
type SortKey = 'newest' | 'oldest' | 'name' | 'last_login'

const PAGE_SIZE = 20
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY_FORM = { email: '', password: '', full_name: '', user_role: 'customer' }

const STATUS_TONE: Record<string, PillTone> = { active: 'success', suspended: 'warning', deleted: 'danger' }

const ROLE_COLORS: Record<string, string> = {
  customer: '#94a3b8',
  hr: '#2876b8',
  visa_officer: '#20875a',
  counselor: '#7c5cc4',
  accountant: '#a66a00',
  marketing: '#d0567a',
  admin: '#2a3555',
  super_admin: '#c49a2b',
}

function roleName(slug: string) {
  return getRoleBySlug(slug)?.name ?? humanize(slug)
}

function relative(value: string | null) {
  return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'Never'
}

function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*?']
  const all = sets.join('')
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length]
  const chars = [...sets.map(pick), ...Array.from({ length: 10 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function friendlyCreateError(err: unknown) {
  const message = err instanceof Error ? err.message : ''
  if (/registered|already exists|duplicate/i.test(message)) return 'An account with this email already exists.'
  if (/password/i.test(message)) return 'That password was rejected. Try a stronger one.'
  return 'We could not create this user. Please try again.'
}

function RoleBadge({ slug }: { slug: string }) {
  const staff = (getRoleBySlug(slug)?.level ?? 0) > 0
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--desk-navy)]">
      <span className="h-2 w-2 rounded-full" style={{ background: ROLE_COLORS[slug] ?? '#94a3b8' }} aria-hidden="true" />
      {staff && <ShieldCheck className="h-3 w-3 text-[var(--desk-gold)]" aria-hidden="true" />}
      {roleName(slug)}
    </span>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  active,
  onClick,
  loading,
}: {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  tone: string
  active?: boolean
  onClick?: () => void
  loading: boolean
}) {
  const body = (
    <>
      <span className={cn('grid h-9 w-9 place-items-center rounded-lg', tone)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="block">
        {loading ? (
          <Skeleton className="h-7 w-12 bg-[var(--desk-line)]/60" />
        ) : (
          <span className="desk-display block text-2xl font-semibold tabular-nums text-[var(--desk-navy)]">{value}</span>
        )}
        <span className="block text-sm font-medium text-[var(--desk-navy)]">{label}</span>
        <span className="block text-xs text-[var(--desk-muted)]">{hint}</span>
      </span>
    </>
  )
  const className = cn(
    'desk-card flex h-full w-full flex-col gap-3 p-4 text-left',
    onClick && 'desk-card-interactive',
    active && 'ring-2 ring-[var(--desk-gold)]/60',
  )
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { can } = usePermissions()
  const canUpdate = can('users.update')
  const canDelete = can('users.delete')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_FORM)
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, user_role, status, phone, profile_photo_url, created_at, last_login_at')
        .order('created_at', { ascending: false })
        .limit(500)
      if (err) throw err
      return (rows ?? []) as UserRow[]
    },
  })

  const users = useMemo(() => data ?? [], [data])

  const stats = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86400000
    const count = (predicate: (u: UserRow) => boolean) => users.filter(predicate).length
    return {
      total: users.length,
      active: count((u) => u.status === 'active'),
      suspended: count((u) => u.status === 'suspended'),
      deleted: count((u) => u.status === 'deleted'),
      staff: count((u) => (getRoleBySlug(u.user_role)?.level ?? 0) > 0),
      recent: count((u) => new Date(u.created_at).getTime() > monthAgo),
    }
  }, [users])

  const roleMix = useMemo(
    () =>
      ROLES.map((role) => ({ ...role, count: users.filter((u) => u.user_role === role.slug).length })).filter(
        (role) => role.count > 0,
      ),
    [users],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = users.filter(
      (u) =>
        (statusFilter === 'all' || u.status === statusFilter) &&
        (roleFilter === 'all' || u.user_role === roleFilter) &&
        (!term ||
          u.email.toLowerCase().includes(term) ||
          (u.full_name ?? '').toLowerCase().includes(term) ||
          (u.phone ?? '').includes(term)),
    )
    const time = (value: string | null) => (value ? new Date(value).getTime() : 0)
    return [...rows].sort((a, b) => {
      if (sort === 'oldest') return time(a.created_at) - time(b.created_at)
      if (sort === 'name') return (a.full_name || a.email).localeCompare(b.full_name || b.email)
      if (sort === 'last_login') return time(b.last_login_at) - time(a.last_login_at)
      return time(b.created_at) - time(a.created_at)
    })
  }, [users, search, statusFilter, roleFilter, sort])

  useEffect(() => setPage(1), [search, statusFilter, roleFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = !!search || statusFilter !== 'all' || roleFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
  }

  const openCreate = () => {
    setCreateForm(EMPTY_FORM)
    setCreateErrors({})
    setShowPassword(false)
    setCreateOpen(true)
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (creating) return
    const email = createForm.email.trim()
    const errors: typeof createErrors = {}
    if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'
    if (!meetsPasswordRequirements(createForm.password)) errors.password = 'Use a password that meets every requirement.'
    setCreateErrors(errors)
    const firstInvalid = (['email', 'password'] as const).find((key) => errors[key])
    if (firstInvalid) {
      document.getElementById(`create-user-${firstInvalid}`)?.focus()
      return
    }

    setCreating(true)
    try {
      // Preserve current admin session — signUp may return a session for the new user.
      const { data: sessionBefore } = await supabase.auth.getSession()
      const adminSession = sessionBefore.session

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: createForm.password,
        options: {
          data: {
            full_name: createForm.full_name || undefined,
            role: createForm.user_role,
          },
        },
      })
      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('User was not created')

      // Restore admin session if sign-up swapped it.
      if (adminSession?.access_token && adminSession.refresh_token) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: signUpData.user.id,
        email,
        full_name: createForm.full_name.trim() || null,
        user_role: createForm.user_role,
        status: 'active',
      })
      if (profileError) throw profileError

      const { data: roleRow } = await supabase.from('roles').select('id').eq('slug', createForm.user_role).maybeSingle()
      if (roleRow?.id) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: signUpData.user.id, role_id: roleRow.id }, { onConflict: 'user_id,role_id' })
      }

      toast.success('User created.', { description: 'Share the temporary password securely.' })
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void writeAuditLog({
        action: 'user.created',
        resource: 'user_profiles',
        resourceId: signUpData.user.id,
        newValue: { email, user_role: createForm.user_role },
      })
      navigate(`/admin/users/${signUpData.user.id}`)
    } catch (err: unknown) {
      toast.error(friendlyCreateError(err))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.id === profile?.id) {
      toast.error('You cannot delete your own admin account.')
      setDeleteTarget(null)
      return
    }
    const { data: changed, error: err } = await supabase
      .from('user_profiles')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', deleteTarget.id)
      .select('id')
    if (err || !changed?.length) {
      toast.error('User could not be deleted.', { description: 'Check your admin permissions and try again.' })
      return
    }
    toast.success('User marked as deleted.')
    void writeAuditLog({
      action: 'user.deleted',
      resource: 'user_profiles',
      resourceId: deleteTarget.id,
      oldValue: { email: deleteTarget.email, user_role: deleteTarget.user_role },
      severity: 'critical',
    })
    setDeleteTarget(null)
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const rowActions = (user: UserRow): ReactNode => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${user.full_name || user.email}`}
          className="h-10 w-10 rounded-xl text-[var(--desk-muted)] hover:text-[var(--desk-navy)]"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => setProfileUserId(user.id)}>
          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
          Quick view
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/admin/users/${user.id}`)}>
          <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
          {canUpdate ? 'Edit details' : 'Open details'}
        </DropdownMenuItem>
        {canDelete && user.id !== profile?.id && user.status !== 'deleted' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteTarget(user)}
              className="text-[var(--desk-danger)] focus:bg-red-50 focus:text-[var(--desk-danger)]"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Delete user
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const identity = (user: UserRow) => (
    <button
      type="button"
      onClick={() => setProfileUserId(user.id)}
      className="flex min-w-0 items-center gap-3 rounded-lg text-left"
    >
      <UserAvatar imageUrl={user.profile_photo_url} fullName={user.full_name || user.email} size="sm" />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[var(--desk-navy)] hover:underline">
            {user.full_name || 'Unnamed user'}
          </span>
          {user.id === profile?.id && <StatusPill tone="gold">You</StatusPill>}
        </span>
        <span className="block truncate text-xs text-[var(--desk-muted)]">{user.email}</span>
      </span>
    </button>
  )

  const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'active', label: 'Active', count: stats.active },
    { value: 'suspended', label: 'Suspended', count: stats.suspended },
    { value: 'deleted', label: 'Deleted', count: stats.deleted },
  ]

  const selectClass = 'h-11 w-full rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] text-sm sm:w-44 text-[var(--desk-navy)] dark:bg-[#121212] dark:border-white/10 dark:text-white'

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="User management"
        description="Search, review and manage every applicant and staff account in one place."
        meta={
          <>
            <StatusPill tone="navy" icon={Users}>
              {stats.total} accounts
            </StatusPill>
            {dataUpdatedAt > 0 && (
              <StatusPill tone="neutral" icon={RefreshCw}>
                {isFetching ? 'Syncing…' : `Synced ${formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}`}
              </StatusPill>
            )}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 rounded-full border-[var(--desk-line)] bg-[var(--desk-surface)] text-[var(--desk-navy)]"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <PermissionGuard permission="users.create">
              <Button
                type="button"
                onClick={openCreate}
                className="min-h-11 rounded-full bg-[var(--desk-navy)] px-5 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)] dark:bg-[var(--desk-gold)] dark:text-black dark:hover:bg-[var(--desk-gold-soft)] font-semibold"
              >
                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add user
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <Reveal className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Total users"
            value={stats.total}
            hint={`${stats.recent} joined in 30 days`}
            icon={Users}
            tone="bg-[#c49a2b]/12 text-[#8a6a1a] dark:bg-[#c49a2b]/20 dark:text-amber-300"
            loading={isLoading}
            active={statusFilter === 'all' && roleFilter === 'all'}
            onClick={clearFilters}
          />
          <StatCard
            label="Active"
            value={stats.active}
            hint="Can sign in"
            icon={UserRoundCheck}
            tone="bg-emerald-100/80 text-[#20875a] dark:bg-emerald-950/50 dark:text-emerald-300"
            loading={isLoading}
            active={statusFilter === 'active'}
            onClick={() => setStatusFilter('active')}
          />
          <StatCard
            label="Suspended"
            value={stats.suspended}
            hint="Access paused"
            icon={UserRoundX}
            tone="bg-amber-100/80 text-[#a66a00] dark:bg-amber-950/50 dark:text-amber-300"
            loading={isLoading}
            active={statusFilter === 'suspended'}
            onClick={() => setStatusFilter('suspended')}
          />
          <StatCard
            label="Staff accounts"
            value={stats.staff}
            hint="Non-customer roles"
            icon={ShieldCheck}
            tone="bg-[#1a2340] text-[#e8b84b] dark:bg-sky-950/50 dark:text-sky-300"
            loading={isLoading}
          />
        </div>

        <section aria-labelledby="role-mix-heading" className="desk-card p-4">
          <div className="flex items-center justify-between">
            <h2 id="role-mix-heading" className="text-sm font-semibold text-[var(--desk-navy)]">
              Role mix
            </h2>
            <Sparkles className="h-4 w-4 text-[var(--desk-gold)]" aria-hidden="true" />
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-3 w-full rounded-full bg-[var(--desk-line)]/60" />
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[var(--desk-line)]/60" aria-hidden="true">
                {roleMix.map((role) => (
                  <span
                    key={role.slug}
                    style={{ width: `${(role.count / Math.max(stats.total, 1)) * 100}%`, background: ROLE_COLORS[role.slug] }}
                  />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                {roleMix.map((role) => (
                  <li key={role.slug}>
                    <button
                      type="button"
                      onClick={() => setRoleFilter(roleFilter === role.slug ? 'all' : role.slug)}
                      aria-pressed={roleFilter === role.slug}
                      className={cn(
                        'flex min-h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-xs transition hover:bg-[var(--desk-surface-soft)]',
                        roleFilter === role.slug && 'bg-[var(--desk-gold)]/10 font-semibold',
                      )}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ROLE_COLORS[role.slug] }} aria-hidden="true" />
                      <span className="truncate text-[var(--desk-navy)]">{role.name}</span>
                      <span className="ml-auto tabular-nums text-[var(--desk-muted)]">{role.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="users-directory-heading" className="desk-card p-4 sm:p-5">
          <h2 id="users-directory-heading" className="sr-only">
            User directory
          </h2>

          <div role="tablist" aria-label="Filter by status" className="desk-scroll-x -mx-1 flex gap-1 overflow-x-auto px-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                  statusFilter === tab.value
                    ? 'bg-[var(--desk-navy)] text-[#fff8e7] dark:bg-[var(--desk-gold)] dark:text-black font-semibold shadow-xs'
                    : 'text-[var(--desk-muted)] hover:bg-[var(--desk-surface-soft)] hover:text-[var(--desk-navy)]',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] tabular-nums',
                    statusFilter === tab.value ? 'bg-white/15 dark:bg-black/20' : 'bg-[var(--desk-line)]/60',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="users-search" className="sr-only">
                Search users
              </label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desk-muted)]" aria-hidden="true" />
              <Input
                id="users-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or phone…"
                className="h-11 rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] pl-10 text-[var(--desk-navy)] placeholder:text-[var(--desk-muted)] dark:bg-[#121212] dark:border-white/10 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger aria-label="Filter by role" className={selectClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role.slug} value={role.slug}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                <SelectTrigger aria-label="Sort users" className={selectClass}>
                  <ArrowDownAZ className="mr-1 h-4 w-4 text-[var(--desk-muted)]" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="last_login">Recent sign-in</SelectItem>
                </SelectContent>
              </Select>
              <div
                role="group"
                aria-label="Layout"
                className="col-span-2 hidden h-11 items-center rounded-xl border border-[var(--desk-line)] p-1 md:flex dark:border-white/10 dark:bg-[#121212]"
              >
                {(
                  [
                    { value: 'table', icon: Rows3, label: 'Table view' },
                    { value: 'cards', icon: LayoutGrid, label: 'Card view' },
                  ] as const
                ).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setView(value)}
                    aria-pressed={view === value}
                    aria-label={label}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-lg transition',
                      view === value
                        ? 'bg-[var(--desk-navy)] text-[#fff8e7] dark:bg-[var(--desk-gold)] dark:text-black font-semibold'
                        : 'text-[var(--desk-muted)] hover:text-[var(--desk-navy)] dark:hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--desk-muted)]" aria-live="polite">
              <span>
                {filtered.length} of {stats.total} users
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--desk-line)] px-2.5 font-semibold text-[var(--desk-navy)] hover:bg-[var(--desk-surface-soft)]"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-4">
            {isError ? (
              <InlineError title="We could not load users." onRetry={() => void refetch()} isRetrying={isFetching} />
            ) : isLoading ? (
              <div className="space-y-2" role="status">
                <span className="sr-only">Loading users…</span>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl bg-[var(--desk-line)]/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={hasFilters ? Search : Users}
                title={hasFilters ? 'No users match these filters' : 'No users yet'}
                description={hasFilters ? 'Try a different search or clear the filters.' : 'New accounts will appear here.'}
                actions={
                  hasFilters ? (
                    <Button type="button" variant="outline" onClick={clearFilters} className="min-h-11 rounded-full border-[var(--desk-line)]">
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                {/* Table: md+ when table view is selected */}
                <div className={cn('overflow-x-auto rounded-xl border border-[var(--desk-line)]', view === 'table' ? 'hidden md:block' : 'hidden')}>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[var(--desk-surface-soft)] text-left text-xs uppercase tracking-wide text-[var(--desk-muted)]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">User</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Last sign-in</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--desk-line)]">
                      {pageRows.map((user) => (
                        <tr key={user.id} className="transition hover:bg-[var(--desk-surface-soft)]/70">
                          <td className="max-w-[280px] px-4 py-3">{identity(user)}</td>
                          <td className="px-4 py-3">
                            <RoleBadge slug={user.user_role} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone={STATUS_TONE[user.status] ?? 'neutral'}>{humanize(user.status)}</StatusPill>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--desk-muted)]">{formatDate(user.created_at)}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--desk-muted)]">{relative(user.last_login_at)}</td>
                          <td className="px-4 py-3 text-right">{rowActions(user)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards: always on mobile, and on md+ when card view is selected */}
                <ul className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3', view === 'table' && 'md:hidden')}>
                  {pageRows.map((user) => (
                    <li key={user.id} className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface)] p-4 transition hover:border-[var(--desk-gold)]/45">
                      <div className="flex items-start justify-between gap-2">
                        {identity(user)}
                        {rowActions(user)}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <RoleBadge slug={user.user_role} />
                        <StatusPill tone={STATUS_TONE[user.status] ?? 'neutral'}>{humanize(user.status)}</StatusPill>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--desk-line)] pt-3 text-xs">
                        <div>
                          <dt className="text-[var(--desk-muted)]">Joined</dt>
                          <dd className="font-medium text-[var(--desk-navy)]">{formatDate(user.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--desk-muted)]">Last sign-in</dt>
                          <dd className="font-medium text-[var(--desk-navy)]">{relative(user.last_login_at)}</dd>
                        </div>
                        {user.phone && (
                          <div className="col-span-2 flex items-center gap-1.5 text-[var(--desk-muted)]">
                            <Phone className="h-3 w-3" aria-hidden="true" />
                            {user.phone}
                          </div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>

                {pageCount > 1 && (
                  <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-[var(--desk-muted)]">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className="h-10 w-10 rounded-xl border-[var(--desk-line)]"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <span className="min-w-16 text-center text-sm tabular-nums text-[var(--desk-navy)]" aria-current="page">
                        {currentPage} / {pageCount}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === pageCount}
                        aria-label="Next page"
                        className="h-10 w-10 rounded-xl border-[var(--desk-line)]"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>
      </Reveal>

      <AdminUserProfileDialog userId={profileUserId} onClose={() => setProfileUserId(null)} />

      <Dialog open={createOpen} onOpenChange={(open) => !creating && setCreateOpen(open)}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[var(--desk-line)] bg-[var(--desk-surface)] p-0 text-[var(--desk-navy)] sm:max-w-xl dark:bg-[#0a0a0a] dark:border-white/15"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="border-b border-[var(--desk-line)] px-5 pb-4 pt-5 text-left sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--desk-navy)] text-[var(--desk-gold-soft)]">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <DialogTitle className="desk-display text-xl font-semibold">Add a user</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-[var(--desk-muted)]">
              Creates a sign-in account and profile. Share the temporary password through a secure channel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} noValidate className="space-y-4 px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-user-name">Full name</Label>
                <Input
                  id="create-user-name"
                  autoComplete="off"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="h-11 rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] dark:bg-[#121212] dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-user-email">
                  Email <span className="text-[var(--desk-danger)]" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="create-user-email"
                  type="email"
                  autoComplete="off"
                  value={createForm.email}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                    setCreateErrors((p) => ({ ...p, email: undefined }))
                  }}
                  aria-invalid={!!createErrors.email}
                  aria-describedby={createErrors.email ? 'create-user-email-error' : undefined}
                  className="h-11 rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] dark:bg-[#121212] dark:text-white aria-[invalid=true]:border-[var(--desk-danger)]"
                />
                {createErrors.email && (
                  <p id="create-user-email-error" className="text-xs font-medium text-[var(--desk-danger)]">
                    {createErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="create-user-password">
                  Temporary password <span className="text-[var(--desk-danger)]" aria-hidden="true">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setCreateForm((p) => ({ ...p, password: generatePassword() }))
                    setCreateErrors((p) => ({ ...p, password: undefined }))
                    setShowPassword(true)
                  }}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-[#8a6a1a] hover:bg-[var(--desk-gold)]/10"
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate
                </button>
              </div>
              <div className="relative">
                <Input
                  id="create-user-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                    setCreateErrors((p) => ({ ...p, password: undefined }))
                  }}
                  aria-invalid={!!createErrors.password}
                  aria-describedby={['create-user-strength', createErrors.password && 'create-user-password-error'].filter(Boolean).join(' ')}
                  className="h-11 rounded-xl border-[var(--desk-line)] bg-[var(--desk-surface)] dark:bg-[#121212] dark:text-white pr-12 font-mono aria-[invalid=true]:border-[var(--desk-danger)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-[var(--desk-muted)] hover:text-[var(--desk-navy)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {createErrors.password && (
                <p id="create-user-password-error" className="text-xs font-medium text-[var(--desk-danger)]">
                  {createErrors.password}
                </p>
              )}
              <div className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] p-3">
                <PasswordStrengthMeter id="create-user-strength" password={createForm.password} />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Role</legend>
              <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {ROLES.map((role) => {
                  const selected = createForm.user_role === role.slug
                  return (
                    <label
                      key={role.slug}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-[var(--desk-gold)]',
                        selected
                          ? 'border-[var(--desk-gold)] bg-[var(--desk-gold)]/8'
                          : 'border-[var(--desk-line)] hover:border-[var(--desk-gold)]/45',
                      )}
                    >
                      <input
                        type="radio"
                        name="create-user-role"
                        value={role.slug}
                        checked={selected}
                        onChange={() => setCreateForm((p) => ({ ...p, user_role: role.slug }))}
                        className="sr-only"
                      />
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ROLE_COLORS[role.slug] }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{role.name}</span>
                        <span className="block text-xs text-[var(--desk-muted)]">{role.description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <DialogFooter className="flex-col-reverse gap-2 border-t border-[var(--desk-line)] pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                className="min-h-11 rounded-full border-[var(--desk-line)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="min-h-11 rounded-full bg-[var(--desk-navy)] px-6 text-[#fff8e7] hover:bg-[var(--desk-navy-soft)] dark:bg-[var(--desk-gold)] dark:text-black dark:hover:bg-[var(--desk-gold-soft)] font-semibold"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  'Create user'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title="Delete this user?"
        description={
          deleteTarget
            ? `${deleteTarget.email} will be marked as deleted and lose access. The sign-in account itself is not removed.`
            : 'Mark this user as deleted?'
        }
        confirmLabel="Delete user"
        variant="destructive"
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

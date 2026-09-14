import { useMemo, useState } from 'react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/rbac'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge, roleBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminUserProfileDialog } from '@/components/admin/AdminUserProfileDialog'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { writeAuditLog } from '@/lib/audit-log'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type UserRow = {
  id: string
  full_name: string | null
  email: string
  user_role: string
  status: string
  phone: string | null
  created_at: string
  last_login_at: string | null
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { can } = usePermissions()
  const canUpdate = can('users.update')
  const canDelete = can('users.delete')
  const canCreate = can('users.create')

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    user_role: 'customer',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from('user_profiles')
        .select(
          'id, full_name, email, user_role, status, phone, created_at, last_login_at',
        )
        .order('created_at', { ascending: false })
        .limit(500)
      if (err) throw err
      return (rows ?? []) as UserRow[]
    },
  })

  const users = data ?? []

  const columns = useMemo(
    () => [
      {
        key: 'full_name',
        header: 'User',
        accessor: (row: UserRow) => (
          <button
            type="button"
            className="text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            onClick={(event) => {
              event.stopPropagation()
              setProfileUserId(row.id)
            }}
          >
            {row.full_name || 'Unnamed'}
          </button>
        ),
        sortable: true,
      },
      {
        key: 'email',
        header: 'Email',
        accessor: (row: UserRow) => row.email,
        sortable: true,
        className: 'text-muted-foreground',
      },
      {
        key: 'user_role',
        header: 'Role',
        accessor: (row: UserRow) => roleBadge(row.user_role),
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        accessor: (row: UserRow) => (
          <StatusBadge
            status={row.status}
            variant={
              row.status === 'active'
                ? 'success'
                : row.status === 'suspended'
                  ? 'destructive'
                  : 'default'
            }
          />
        ),
        sortable: true,
      },
      {
        key: 'actions',
        header: 'Actions',
        accessor: (row: UserRow) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProfileUserId(row.id)}
            >
              {canUpdate ? 'Edit' : 'View'}
            </Button>
            {canDelete && row.id !== profile?.id && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget(row)}
              >
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate, profile?.id],
  )

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email and temporary password are required')
      return
    }
    if (createForm.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setCreating(true)
    try {
      // Preserve current admin session — signUp may return a session for the new user.
      const { data: sessionBefore } = await supabase.auth.getSession()
      const adminSession = sessionBefore.session

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: createForm.email.trim(),
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
        email: createForm.email.trim(),
        full_name: createForm.full_name || null,
        user_role: createForm.user_role,
        status: 'active',
      })
      if (profileError) throw profileError

      const { data: roleRow } = await supabase
        .from('roles')
        .select('id')
        .eq('slug', createForm.user_role)
        .maybeSingle()
      if (roleRow?.id) {
        await supabase.from('user_roles').upsert(
          { user_id: signUpData.user.id, role_id: roleRow.id },
          { onConflict: 'user_id,role_id' },
        )
      }

      toast.success('User created. Share the temporary password securely.')
      setCreateOpen(false)
      setCreateForm({ email: '', password: '', full_name: '', user_role: 'customer' })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void writeAuditLog({
        action: 'user.created',
        resource: 'user_profiles',
        resourceId: signUpData.user.id,
        newValue: { email: createForm.email.trim(), user_role: createForm.user_role },
      })
      navigate(`/admin/users/${signUpData.user.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.id === profile?.id) {
      toast.error('You cannot delete your own admin account')
      setDeleteTarget(null)
      return
    }
    const { data: changed, error: err } = await supabase
      .from('user_profiles')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', deleteTarget.id)
      .select('id')
    if (err) {
      toast.error(err.message)
      return
    }
    if (!changed?.length) {
      toast.error('User could not be deleted. Check your admin permissions.')
      return
    }
    toast.success('User marked as deleted')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Users className="h-6 w-6" /> Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, edit, and manage user accounts
          </p>
        </div>
        <PermissionGuard permission="users.create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not load users: {(error as Error).message}
          <Button variant="link" className="ml-2 h-auto p-0" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="No users found"
        searchPlaceholder="Search by email or name..."
        onRowClick={(row) => setProfileUserId(row.id)}
      />

      <AdminUserProfileDialog
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Creates an auth account and profile. Share the temporary password securely.
              {canCreate ? null : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={createForm.full_name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary password</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={createForm.user_role}
                onValueChange={(v) =>
                  setCreateForm((p) => ({ ...p, user_role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create user'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        title="Delete user?"
        description={
          deleteTarget
            ? `Mark ${deleteTarget.email} as deleted? This does not remove the auth account.`
            : 'Mark this user as deleted?'
        }
        confirmLabel="Delete"
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

/**
 * Admin user detail / edit page.
 * Route: /admin/users/:id
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Save, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
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
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/rbac'
import { supabase } from '@/lib/supabase/client'
import { StatusBadge, roleBadge } from '@/components/admin/StatusBadge'
import { writeAuditLog } from '@/lib/audit-log'

type UserProfileRow = {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  whatsapp: string | null
  gender: string | null
  nationality: string | null
  current_city: string | null
  current_country: string | null
  education_level: string | null
  field_of_study: string | null
  user_role: string
  status: string
  created_at: string
  updated_at: string
  last_login_at: string | null
  onboarding_complete: boolean | null
}

const STATUS_OPTIONS = ['active', 'suspended', 'deleted'] as const

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { can } = usePermissions()
  const canUpdate = can('users.update')
  const canDelete = can('users.delete')

  const [form, setForm] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    whatsapp: '',
    gender: '',
    nationality: '',
    current_city: '',
    current_country: '',
    education_level: '',
    field_of_study: '',
    user_role: 'customer',
    status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const query = useQuery({
    queryKey: ['admin-user', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('User not found')
      return data as UserProfileRow
    },
  })

  useEffect(() => {
    if (!query.data) return
    const u = query.data
    setForm({
      full_name: u.full_name || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      whatsapp: u.whatsapp || '',
      gender: u.gender || '',
      nationality: u.nationality || '',
      current_city: u.current_city || '',
      current_country: u.current_country || '',
      education_level: u.education_level || '',
      field_of_study: u.field_of_study || '',
      user_role: u.user_role || 'customer',
      status: u.status || 'active',
    })
  }, [query.data])

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!id || !canUpdate) return
    const before = query.data
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: form.full_name || null,
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          gender: form.gender || null,
          nationality: form.nationality || null,
          current_city: form.current_city || null,
          current_country: form.current_country || null,
          education_level: form.education_level || null,
          field_of_study: form.field_of_study || null,
          user_role: form.user_role,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('User could not be updated. Check your admin permissions.')

      // Keep user_roles in sync with primary profile role (trigger also does this).
      const { data: roleRow } = await supabase
        .from('roles')
        .select('id')
        .eq('slug', form.user_role)
        .maybeSingle()
      if (roleRow?.id) {
        await supabase.from('user_roles').delete().eq('user_id', id)
        await supabase.from('user_roles').upsert(
          { user_id: id, role_id: roleRow.id },
          { onConflict: 'user_id,role_id' },
        )
      }

      toast.success('User updated')
      await queryClient.invalidateQueries({ queryKey: ['admin-user', id] })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })

      if (before) {
        if (before.user_role !== form.user_role) {
          void writeAuditLog({
            action: 'user.role_changed',
            resource: 'user_profiles',
            resourceId: id,
            oldValue: { user_role: before.user_role },
            newValue: { user_role: form.user_role },
            severity: 'warning',
          })
        }
        if (before.status !== form.status) {
          void writeAuditLog({
            action: form.status === 'suspended' ? 'user.suspended' : form.status === 'active' ? 'user.activated' : 'user.updated',
            resource: 'user_profiles',
            resourceId: id,
            oldValue: { status: before.status },
            newValue: { status: form.status },
            severity: form.status === 'suspended' ? 'warning' : 'info',
          })
        }
        const profileFieldsChanged = (
          before.full_name !== form.full_name ||
          before.phone !== form.phone ||
          before.current_city !== form.current_city ||
          before.current_country !== form.current_country
        )
        if (profileFieldsChanged) {
          void writeAuditLog({
            action: 'user.updated',
            resource: 'user_profiles',
            resourceId: id,
            oldValue: { full_name: before.full_name, phone: before.phone, current_city: before.current_city, current_country: before.current_country },
            newValue: { full_name: form.full_name, phone: form.phone, current_city: form.current_city, current_country: form.current_country },
          })
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleSoftDelete = async () => {
    if (!id || !canDelete) return
    if (id === profile?.id) {
      toast.error('You cannot delete your own admin account')
      setDeleteOpen(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('User could not be deleted. Check your admin permissions.')
      toast.success('User marked as deleted')
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void writeAuditLog({
        action: 'user.deleted',
        resource: 'user_profiles',
        resourceId: id,
        oldValue: { email: query.data?.email, user_role: query.data?.user_role },
        severity: 'critical',
      })
      navigate('/admin/users')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to users
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          {(query.error as Error)?.message || 'User not found'}
        </p>
      </div>
    )
  }

  const user = query.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" /> Users
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <User className="h-6 w-6" />
            {user.full_name || user.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {roleBadge(user.user_role)}
            <StatusBadge
              status={user.status}
              variant={
                user.status === 'active'
                  ? 'success'
                  : user.status === 'suspended'
                    ? 'destructive'
                    : 'default'
              }
            />
          </div>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="users.delete">
            <Button
              variant="destructive"
              size="sm"
              disabled={id === profile?.id}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="users.update">
            <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save changes
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full name</Label>
              <Input
                value={form.full_name}
                disabled={!canUpdate}
                onChange={(e) => setField('full_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.first_name}
                disabled={!canUpdate}
                onChange={(e) => setField('first_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.last_name}
                disabled={!canUpdate}
                onChange={(e) => setField('last_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                disabled={!canUpdate}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                disabled={!canUpdate}
                onChange={(e) => setField('whatsapp', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Input
                value={form.gender}
                disabled={!canUpdate}
                onChange={(e) => setField('gender', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nationality</Label>
              <Input
                value={form.nationality}
                disabled={!canUpdate}
                onChange={(e) => setField('nationality', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.current_city}
                disabled={!canUpdate}
                onChange={(e) => setField('current_city', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                value={form.current_country}
                disabled={!canUpdate}
                onChange={(e) => setField('current_country', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Education</Label>
              <Input
                value={form.education_level}
                disabled={!canUpdate}
                onChange={(e) => setField('education_level', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Field of study</Label>
              <Input
                value={form.field_of_study}
                disabled={!canUpdate}
                onChange={(e) => setField('field_of_study', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Access
          </h2>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.user_role}
              disabled={!canUpdate}
              onValueChange={(v) => setField('user_role', v)}
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
                {/* Legacy aliases still in DB */}
                <SelectItem value="user">User (legacy)</SelectItem>
                <SelectItem value="manager">Manager (legacy)</SelectItem>
                <SelectItem value="superadmin">Superadmin (legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              disabled={!canUpdate}
              onValueChange={(v) => setField('status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <dl className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>User ID</dt>
              <dd className="truncate font-mono">{user.id}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Created</dt>
              <dd>{new Date(user.created_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Updated</dt>
              <dd>{new Date(user.updated_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Last login</dt>
              <dd>
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleString()
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Onboarding</dt>
              <dd>{user.onboarding_complete ? 'Complete' : 'Incomplete'}</dd>
            </div>
          </dl>
        </section>
      </div>

      <ConfirmDialog
        title="Delete user?"
        description="This soft-deletes the profile (status = deleted). The auth account is not removed from Supabase Auth."
        confirmLabel="Delete user"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleSoftDelete}
      />
    </div>
  )
}

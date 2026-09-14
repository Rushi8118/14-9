import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  MailCheck,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/rbac'
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
import { StatusBadge, roleBadge } from '@/components/admin/StatusBadge'
import { writeAuditLog } from '@/lib/audit-log'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type AdminUserProfileDialogProps = {
  userId: string | null
  onClose: () => void
}

type Profile = {
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
  profile_photo_url?: string | null
}

type ActivityRow = {
  id: string
  event_type: string
  page_path: string | null
  created_at: string
}

type RoleRow = { id: string; name: string; slug: string }
type PermissionRow = { key: string; name: string }
type SecurityDetails = {
  email_confirmed_at: string | null
  phone_confirmed_at: string | null
  last_sign_in_at: string | null
  confirmation_sent_at: string | null
  recovery_sent_at: string | null
  app_metadata: Record<string, unknown> | null
}

function display(value: string | null | undefined) {
  return value || 'Not provided'
}

export function AdminUserProfileDialog({ userId, onClose }: AdminUserProfileDialogProps) {
  const queryClient = useQueryClient()
  const { profile: currentProfile } = useAuth()
  const { can } = usePermissions()
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
  const [action, setAction] = useState<'reset' | 'verify' | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const details = useQuery({
    queryKey: ['admin-user-profile-dialog', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      // Admin activity is stored separately from visitor activity, so read both logs.
      const [profileResult, rolesResult, visitorActivityResult, adminActivityResult, securityResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId!).maybeSingle(),
        supabase.from('user_roles').select('role_id, roles(id, name, slug)').eq('user_id', userId!),
        supabase.from('interactions').select('id, event_type, page_path, created_at').eq('user_id', userId!).order('created_at', { ascending: false }).limit(12),
        supabase.from('admin_access_logs').select('id, event_type, page_path, created_at').eq('user_id', userId!).order('created_at', { ascending: false }).limit(12),
        supabase.rpc('get_admin_user_security_details', { p_user_id: userId! }),
      ])
      const activityResult = {
        data: [...(visitorActivityResult.data ?? []), ...(adminActivityResult.error ? [] : adminActivityResult.data ?? [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 12),
        error: visitorActivityResult.error,
      }
      if (profileResult.error) throw profileResult.error
      if (!profileResult.data) throw new Error('User not found')

      const roleLinks = (rolesResult.data ?? []) as Array<{ role_id: string; roles: RoleRow | RoleRow[] | null }>
      const roles = roleLinks.map((link) => Array.isArray(link.roles) ? link.roles[0] : link.roles).filter(Boolean) as RoleRow[]
      const roleIds = roles.map((role) => role.id)
      let permissions: PermissionRow[] = []
      if (roleIds.length) {
        const { data: permissionLinks, error: permissionError } = await supabase
          .from('role_permissions')
          .select('permissions(key, name)')
          .in('role_id', roleIds)
        if (permissionError) throw permissionError
        permissions = (permissionLinks ?? [])
          .map((row) => Array.isArray(row.permissions) ? row.permissions[0] : row.permissions)
          .filter(Boolean) as PermissionRow[]
      }
      return {
        profile: profileResult.data as Profile,
        roles,
        permissions: Array.from(new Map(permissions.map((permission) => [permission.key, permission])).values()),
        activity: (activityResult.data ?? []) as ActivityRow[],
        activityError: activityResult.error?.message ?? null,
        security: (securityResult.data?.[0] ?? null) as SecurityDetails | null,
        securityError: securityResult.error?.message ?? null,
      }
    },
  })

  const user = details.data?.profile
  const canUpdate = can('users.update')
  const canDelete = can('users.delete')

  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      gender: user.gender || '',
      nationality: user.nationality || '',
      current_city: user.current_city || '',
      current_country: user.current_country || '',
      education_level: user.education_level || '',
      field_of_study: user.field_of_study || '',
      user_role: user.user_role || 'customer',
      status: user.status || 'active',
    })
  }, [user])

  useEffect(() => {
    if (userId) setActiveTab('overview')
  }, [userId])

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    if (!userId || !canUpdate) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('user_profiles').update({
        ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value || null])),
        updated_at: new Date().toISOString(),
      }).eq('id', userId).select('id').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('User could not be updated. Check your permissions.')

      const { data: role } = await supabase.from('roles').select('id').eq('slug', form.user_role).maybeSingle()
      if (role) {
        const { error: roleDeleteError } = await supabase.from('user_roles').delete().eq('user_id', userId)
        if (roleDeleteError) throw roleDeleteError
        const { error: roleInsertError } = await supabase.from('user_roles').upsert({ user_id: userId, role_id: role.id }, { onConflict: 'user_id,role_id' })
        if (roleInsertError) throw roleInsertError
      }
      toast.success('User profile updated')
      await queryClient.invalidateQueries({ queryKey: ['admin-user-profile-dialog', userId] })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })

      if (user) {
        if (user.user_role !== form.user_role) {
          void writeAuditLog({
            action: 'user.role_changed',
            resource: 'user_profiles',
            resourceId: userId,
            oldValue: { user_role: user.user_role },
            newValue: { user_role: form.user_role },
            severity: 'warning',
          })
        }
        if (user.status !== form.status) {
          void writeAuditLog({
            action: form.status === 'suspended' ? 'user.suspended' : form.status === 'active' ? 'user.activated' : 'user.updated',
            resource: 'user_profiles',
            resourceId: userId,
            oldValue: { status: user.status },
            newValue: { status: form.status },
            severity: form.status === 'suspended' ? 'warning' : 'info',
          })
        }
        if (user.user_role === form.user_role && user.status === form.status) {
          void writeAuditLog({ action: 'user.updated', resource: 'user_profiles', resourceId: userId })
        }
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const sendAccountEmail = async (type: 'verify' | 'reset') => {
    if (!user || !canUpdate) return
    setAction(type)
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-email', {
        body: { email: user.email, type },
      })
      if (error) {
        // FunctionsHttpError bodies carry the real server-side reason.
        const context = (error as { context?: Response }).context
        let message = error.message
        try {
          const body = context ? await context.clone().json() : null
          if (body?.error) message = body.error
        } catch {
          // ignore parse failure, fall back to error.message
        }
        throw new Error(message)
      }
      if (data?.error) throw new Error(data.error)
      toast.success(type === 'verify' ? 'Verification email sent' : 'Password reset email sent')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to send ${type === 'verify' ? 'verification' : 'password reset'} email`)
    } finally {
      setAction(null)
    }
  }

  const sendPasswordReset = () => sendAccountEmail('reset')
  const sendVerification = () => sendAccountEmail('verify')

  const softDelete = async () => {
    if (!userId || !canDelete || userId === currentProfile?.id) return
    const { data, error } = await supabase.from('user_profiles').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', userId).select('id').maybeSingle()
    if (error) toast.error(error.message)
    else if (!data) toast.error('User could not be deleted. Check your permissions.')
    else {
      toast.success('User marked as deleted')
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void writeAuditLog({
        action: 'user.deleted',
        resource: 'user_profiles',
        resourceId: userId,
        oldValue: user ? { email: user.email, user_role: user.user_role } : undefined,
        severity: 'critical',
      })
      onClose()
    }
  }

  const initials = user?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'
  const contactFields = ['full_name', 'first_name', 'last_name', 'phone', 'whatsapp'] as const
  const personalFields = ['gender', 'nationality', 'current_city', 'current_country'] as const
  const educationFields = ['education_level', 'field_of_study'] as const
  const fieldLabel = (field: string) => field.replaceAll('_', ' ')

  const fieldGrid = (fields: readonly (keyof typeof form)[]) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field} className="min-w-0 space-y-1.5">
          <Label htmlFor={`admin-user-${field}`} className="capitalize">{fieldLabel(field)}</Label>
          <Input id={`admin-user-${field}`} className="h-10 w-full" disabled={!canUpdate} value={form[field]} onChange={(event) => setField(field, event.target.value)} />
        </div>
      ))}
    </div>
  )

  const securitySummary = user && (
    <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-primary" />Access & security</h3>
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        <div className="space-y-1.5"><Label htmlFor="admin-user-role">Role</Label><Select disabled={!canUpdate} value={form.user_role} onValueChange={(value) => setField('user_role', value)}><SelectTrigger id="admin-user-role" className="h-10"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((role) => <SelectItem key={role.slug} value={role.slug}>{role.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="admin-user-status">Account status</Label><Select disabled={!canUpdate} value={form.status} onValueChange={(value) => setField('status', value)}><SelectTrigger id="admin-user-status" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select></div>
      </div>
      <dl className="grid gap-x-4 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-2 2xl:grid-cols-1"><div><dt className="text-muted-foreground">Created</dt><dd>{new Date(user.created_at).toLocaleString()}</dd></div><div><dt className="text-muted-foreground">Last login</dt><dd>{details.data?.security?.last_sign_in_at ? new Date(details.data.security.last_sign_in_at).toLocaleString() : user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</dd></div><div><dt className="text-muted-foreground">Email verification</dt><dd>{details.data?.security?.email_confirmed_at ? 'Verified' : 'Not verified'}</dd></div><div><dt className="text-muted-foreground">Phone verification</dt><dd>{details.data?.security?.phone_confirmed_at ? 'Verified' : 'Not verified'}</dd></div><div><dt className="text-muted-foreground">Onboarding</dt><dd>{user.onboarding_complete ? 'Complete' : 'Incomplete'}</dd></div></dl>
    </section>
  )

  return (
    <Dialog open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[94dvh] w-[calc(100%-1rem)] max-w-[68rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[68rem] lg:w-[min(68rem,calc(100%-3rem))]">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 border border-border"><AvatarImage src={user?.profile_photo_url || undefined} alt="" /><AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
              <div className="min-w-0"><DialogTitle className="truncate text-lg">{details.isLoading ? 'Loading user profile' : user?.full_name || user?.email || 'User profile'}</DialogTitle><DialogDescription className="truncate">{user?.email || 'Complete user profile'}</DialogDescription>{user && <div className="mt-1.5 flex flex-wrap gap-1.5">{roleBadge(user.user_role)}<StatusBadge status={user.status} variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'destructive' : 'default'} /></div>}</div>
            </div>
          </div>
        </DialogHeader>

        {details.isLoading && <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}
        {details.isError && <div className="m-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{(details.error as Error).message}</div>}

        {user && <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-0 flex-1 overflow-hidden">
          <div className="shrink-0 overflow-x-auto border-b border-border px-5 sm:px-7"><TabsList className="h-11 w-max min-w-full justify-start gap-1 rounded-none bg-transparent p-0"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="personal">Personal</TabsTrigger><TabsTrigger value="education">Education</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList></div>
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
            <TabsContent value="overview" className="mt-0 space-y-5">
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
                <div className="space-y-5">
                  <section className="rounded-xl border border-border p-4 sm:p-5">
                    <div className="mb-4"><h3 className="text-sm font-semibold">Profile & contact</h3><p className="mt-1 text-xs text-muted-foreground">Core identity and contact information.</p></div>
                    {fieldGrid(contactFields)}
                  </section>
                  <section className="rounded-xl border border-border p-4 sm:p-5">
                    <div className="mb-4"><h3 className="text-sm font-semibold">Personal information & address</h3><p className="mt-1 text-xs text-muted-foreground">Location and personal profile details.</p></div>
                    {fieldGrid(personalFields)}
                  </section>
                  <section className="rounded-xl border border-border p-4 sm:p-5">
                    <div className="mb-4"><h3 className="text-sm font-semibold">Education & experience</h3><p className="mt-1 text-xs text-muted-foreground">Academic background and field of study.</p></div>
                    {fieldGrid(educationFields)}
                  </section>
                  <section className="rounded-xl border border-dashed border-border p-4">
                    <h3 className="text-sm font-semibold">Documents & applications</h3>
                    <p className="mt-1 text-xs text-muted-foreground">No document or application fields are available in the current user profile data.</p>
                  </section>
                </div>
                <div className="space-y-5">
                  {securitySummary}
                  <section className="rounded-xl border border-border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-primary" />Permissions</h3>
                    <div className="flex flex-wrap gap-1.5">{details.data?.permissions.length ? details.data.permissions.map((permission) => <span key={permission.key} className="rounded-full bg-primary/10 px-2 py-1 text-xs" title={permission.name}>{permission.key}</span>) : <span className="text-sm text-muted-foreground">No permissions assigned</span>}</div>
                  </section>
                  <section className="rounded-xl border border-border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-primary" />Account metadata</h3>
                    <dl className="grid gap-3 text-xs sm:grid-cols-2 2xl:grid-cols-1"><div><dt className="text-muted-foreground">User ID</dt><dd className="break-all font-mono">{user.id}</dd></div><div><dt className="text-muted-foreground">Updated</dt><dd>{new Date(user.updated_at).toLocaleString()}</dd></div><div><dt className="text-muted-foreground">Roles loaded</dt><dd>{details.data?.roles.map((role) => role.name).join(', ') || user.user_role}</dd></div><div><dt className="text-muted-foreground">Profile photo</dt><dd>{display(user.profile_photo_url)}</dd></div><div><dt className="text-muted-foreground">Recovery email</dt><dd>{details.data?.security?.recovery_sent_at ? new Date(details.data.security.recovery_sent_at).toLocaleString() : 'Not sent'}</dd></div></dl>
                  </section>
                </div>
              </div>
              <section className="rounded-xl border border-border p-4 sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" />Recent activity</h3>
                {details.data?.activityError ? <p className="text-sm text-muted-foreground">Activity history unavailable: {details.data.activityError}</p> : details.data?.activity.length ? <div className="divide-y divide-border">{details.data.activity.map((entry) => <div key={entry.id} className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span><strong className="capitalize">{entry.event_type.replaceAll('_', ' ')}</strong>{entry.page_path ? ` · ${entry.page_path}` : ''}</span><time className="text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</time></div>)}</div> : <p className="text-sm text-muted-foreground">No activity recorded.</p>}
              </section>
            </TabsContent>
            <TabsContent value="personal" className="mt-0 space-y-5"><section className="rounded-xl border border-border p-4 sm:p-5"><h3 className="mb-4 text-sm font-semibold">Personal information & address</h3>{fieldGrid(personalFields)}</section></TabsContent>
            <TabsContent value="education" className="mt-0 space-y-5"><section className="rounded-xl border border-border p-4 sm:p-5"><h3 className="mb-4 text-sm font-semibold">Education & experience</h3>{fieldGrid(educationFields)}</section><section className="rounded-xl border border-dashed border-border p-4"><h3 className="text-sm font-semibold">Documents & applications</h3><p className="mt-1 text-xs text-muted-foreground">No document or application fields are available in the current user profile data.</p></section></TabsContent>
            <TabsContent value="security" className="mt-0 space-y-5"><div className="max-w-2xl space-y-5">{securitySummary}<section className="rounded-xl border border-border p-4"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-primary" />Account metadata</h3><dl className="grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-muted-foreground">User ID</dt><dd className="break-all font-mono">{user.id}</dd></div><div><dt className="text-muted-foreground">Updated</dt><dd>{new Date(user.updated_at).toLocaleString()}</dd></div><div><dt className="text-muted-foreground">Roles loaded</dt><dd>{details.data?.roles.map((role) => role.name).join(', ') || user.user_role}</dd></div><div><dt className="text-muted-foreground">Profile photo</dt><dd>{display(user.profile_photo_url)}</dd></div><div><dt className="text-muted-foreground">Recovery email</dt><dd>{details.data?.security?.recovery_sent_at ? new Date(details.data.security.recovery_sent_at).toLocaleString() : 'Not sent'}</dd></div><div><dt className="text-muted-foreground">App metadata</dt><dd className="break-all">{details.data?.security?.app_metadata ? JSON.stringify(details.data.security.app_metadata) : 'None'}</dd></div></dl>{details.data?.securityError && <p className="mt-3 text-xs text-muted-foreground">Security metadata unavailable: {details.data.securityError}</p>}</section></div></TabsContent>
            <TabsContent value="activity" className="mt-0"><section className="rounded-xl border border-border p-4 sm:p-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" />Recent activity</h3>{details.data?.activityError ? <p className="text-sm text-muted-foreground">Activity history unavailable: {details.data.activityError}</p> : details.data?.activity.length ? <div className="divide-y divide-border">{details.data.activity.map((entry) => <div key={entry.id} className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span><strong className="capitalize">{entry.event_type.replaceAll('_', ' ')}</strong>{entry.page_path ? ` · ${entry.page_path}` : ''}</span><time className="text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</time></div>)}</div> : <p className="text-sm text-muted-foreground">No activity recorded.</p>}</section></TabsContent>
          </div>
        </Tabs>}

        {user && <div className="shrink-0 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:px-7"><div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!canUpdate || action !== null} onClick={() => void sendPasswordReset()}><KeyRound className="mr-1.5 h-4 w-4" />{action === 'reset' ? 'Sending...' : 'Reset password'}</Button><Button variant="outline" size="sm" disabled={!canUpdate || action !== null} onClick={() => void sendVerification()}><MailCheck className="mr-1.5 h-4 w-4" />{action === 'verify' ? 'Sending...' : 'Send verification'}</Button><ConfirmDialog title="Delete user?" description={`Mark ${user.email} as deleted? The auth account is not removed.`} confirmLabel="Delete" open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={softDelete}><Button variant="destructive" size="sm" disabled={!canDelete || user.id === currentProfile?.id}><XCircle className="mr-1.5 h-4 w-4" />Delete</Button></ConfirmDialog></div><div className="flex gap-2 sm:ml-auto"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!canUpdate || saving} onClick={() => void save()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Save changes</Button></div></div></div>}
      </DialogContent>
    </Dialog>
  )
}

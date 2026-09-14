import { Fragment, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  ROLES, PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_COLORS,
  normalizeRoleSlug,
  type RoleSlug, type PermissionSlug,
} from '@/lib/rbac'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import {
  Check, X, Users, Plus, Save, Edit3, Trash2,
  Shield, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge, roleBadge } from '@/components/admin/StatusBadge'
import { MetricCard } from '@/components/admin/MetricCard'
import { Empty } from '@/components/ui/empty'
import { writeAuditLog } from '@/lib/audit-log'

type Role = {
  id: string
  name: string
  slug: string
  description: string
  is_system: boolean
}

type Permission = {
  id: string
  key: string
  name: string
  module: string
}

export default function RolesPage() {
  const { profile } = useAuth()
  const { can } = usePermissions()
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({})
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Users': true,
    'Roles & Permissions': true,
  })
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' })
  const [assignedPerms, setAssignedPerms] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null; user_role: string }[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showUserManager, setShowUserManager] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    const { data, error } = await supabase.from('roles').select('*').order('slug')
    if (error) {
      toast.error(`Failed to load roles: ${error.message}`)
      return
    }
    setRoles(data ?? [])
  }, [])

  const loadPermissions = useCallback(async () => {
    const { data, error } = await supabase.from('permissions').select('*').order('key')
    if (error) {
      toast.error(`Failed to load permissions: ${error.message}`)
      return
    }
    setAllPermissions(data ?? [])
  }, [])

  const loadRolePerms = useCallback(async () => {
    const { data, error } = await supabase.from('role_permissions').select('role_id, permission_id')
    if (error) {
      toast.error(`Failed to load role permissions: ${error.message}`)
      return
    }
    const map: Record<string, string[]> = {}
    for (const rp of data ?? []) {
      if (!map[rp.role_id]) map[rp.role_id] = []
      map[rp.role_id].push(rp.permission_id)
    }
    setRolePerms(map)
  }, [])

  const loadUserRoles = useCallback(async () => {
    const { data, error } = await supabase.from('user_roles').select('user_id, role_id')
    if (error) {
      console.warn('user_roles load failed:', error.message)
      return
    }
    const map: Record<string, string[]> = {}
    for (const ur of data ?? []) {
      if (!map[ur.user_id]) map[ur.user_id] = []
      map[ur.user_id].push(ur.role_id)
    }
    setUserRoles(map)
  }, [])

  useEffect(() => {
    Promise.all([loadRoles(), loadPermissions(), loadRolePerms(), loadUserRoles()])
      .finally(() => setLoading(false))
  }, [loadRoles, loadPermissions, loadRolePerms, loadUserRoles])

  const searchUsers = async () => {
    if (!userSearch.trim()) return
    setUsersLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, user_role')
        .ilike('email', `%${userSearch}%`)
        .limit(20)
      if (error) throw error
      setUsers(data ?? [])
    } catch {
      toast.error('Could not search users')
    } finally {
      setUsersLoading(false)
    }
  }

  const assignUserRole = async (userId: string, roleId: string, assign: boolean) => {
    try {
      const role = roles.find((r) => r.id === roleId)
      if (assign) {
        const { error } = await supabase.from('user_roles').upsert(
          { user_id: userId, role_id: roleId },
          { onConflict: 'user_id,role_id' },
        )
        if (error) throw error

        // Keep legacy/admin gate column in sync (source of truth for canAccessAdmin).
        if (role?.slug) {
          const { error: profileErr } = await supabase
            .from('user_profiles')
            .update({ user_role: normalizeRoleSlug(role.slug) })
            .eq('id', userId)
          if (profileErr) throw profileErr
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, user_role: normalizeRoleSlug(role.slug) } : u,
            ),
          )
        }

        setUserRoles((prev) => ({
          ...prev,
          [userId]: [...(prev[userId]?.filter((r) => r !== roleId) ?? []), roleId],
        }))
        toast.success('Role assigned to user')
        void writeAuditLog({
          action: 'permission.assigned',
          resource: 'user_roles',
          resourceId: userId,
          newValue: { role_id: roleId, role_slug: role?.slug },
        })
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role_id', roleId)
        if (error) throw error
        setUserRoles((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? []).filter((r) => r !== roleId),
        }))
        toast.success('Role removed from user')
        void writeAuditLog({
          action: 'permission.revoked',
          resource: 'user_roles',
          resourceId: userId,
          oldValue: { role_id: roleId, role_slug: role?.slug },
        })
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : assign
            ? 'Failed to assign role'
            : 'Failed to remove role',
      )
    }
  }

  const startCreate = () => {
    setEditMode('create')
    setFormData({ name: '', slug: '', description: '' })
    setAssignedPerms(new Set())
  }

  const startEdit = (role: Role) => {
    setEditMode('edit')
    setSelectedRole(role.id)
    setFormData({ name: role.name, slug: role.slug, description: role.description ?? '' })
    const currentPerms = allPermissions
      .filter((p) => rolePerms[role.id]?.includes(p.id))
      .map((p) => p.key)
    setAssignedPerms(new Set(currentPerms))
  }

  const cancelEdit = () => {
    setEditMode(null)
    setSelectedRole(null)
    setFormData({ name: '', slug: '', description: '' })
    setAssignedPerms(new Set())
  }

  const togglePermission = (permKey: string) => {
    setAssignedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(permKey)) next.delete(permKey)
      else next.add(permKey)
      return next
    })
  }

  /** Toggle a single cell in the permission matrix (works for system roles too). */
  const toggleMatrixPermission = async (role: Role, permKey: string) => {
    if (!can('permissions.assign') && !can('roles.update') && !can('permissions.manage')) {
      toast.error('You do not have permission to edit role permissions')
      return
    }
    const perm = allPermissions.find((p) => p.key === permKey)
    if (!perm) {
      toast.error('Permission not found in database — run RBAC seed migration')
      return
    }
    const has = rolePerms[role.id]?.includes(perm.id)
    try {
      if (has) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id)
          .eq('permission_id', perm.id)
        if (error) throw error
        setRolePerms((prev) => ({
          ...prev,
          [role.id]: (prev[role.id] ?? []).filter((id) => id !== perm.id),
        }))
        void writeAuditLog({
          action: 'permission.revoked',
          resource: 'role_permissions',
          resourceId: role.id,
          oldValue: { role_slug: role.slug, permission: permKey },
          severity: 'warning',
        })
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: role.id, permission_id: perm.id })
        if (error) throw error
        setRolePerms((prev) => ({
          ...prev,
          [role.id]: [...(prev[role.id] ?? []), perm.id],
        }))
        void writeAuditLog({
          action: 'permission.assigned',
          resource: 'role_permissions',
          resourceId: role.id,
          newValue: { role_slug: role.slug, permission: permKey },
          severity: 'warning',
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update permission')
    }
  }

  const saveRole = async () => {
    if (
      (editMode === 'create' && !can('roles.create')) ||
      (editMode === 'edit' && !can('roles.update'))
    ) {
      toast.error('You do not have permission to save roles')
      return
    }
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required')
      return
    }
    setSaving(true)
    try {
      const editingRole = roles.find((r) => r.id === selectedRole)

      if (editMode === 'create') {
        const { data: newRole, error: roleError } = await supabase
          .from('roles')
          .insert({
            name: formData.name,
            slug: formData.slug.toLowerCase().replace(/[^a-z_]/g, ''),
            description: formData.description,
          })
          .select()
          .single()
        if (roleError) throw roleError

        if (newRole) {
          const permIds = allPermissions
            .filter((p) => assignedPerms.has(p.key))
            .map((p) => p.id)
          if (permIds.length > 0) {
            const { error: rpError } = await supabase.from('role_permissions').insert(
              permIds.map((pid) => ({ role_id: newRole.id, permission_id: pid })),
            )
            if (rpError) throw rpError
          }
        }
        toast.success('Role created successfully')
        void writeAuditLog({
          action: 'role.created',
          resource: 'roles',
          resourceId: newRole?.id,
          newValue: { name: formData.name, slug: formData.slug },
        })
      } else if (editMode === 'edit' && selectedRole) {
        // System roles: only update permissions (DB trigger blocks roles row UPDATE).
        if (!editingRole?.is_system) {
          const { error: roleError } = await supabase
            .from('roles')
            .update({ name: formData.name, description: formData.description })
            .eq('id', selectedRole)
          if (roleError) throw roleError
        }

        const { error: delError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole)
        if (delError) throw delError

        const permIds = allPermissions
          .filter((p) => assignedPerms.has(p.key))
          .map((p) => p.id)
        if (permIds.length > 0) {
          const { error: rpError } = await supabase.from('role_permissions').insert(
            permIds.map((pid) => ({ role_id: selectedRole, permission_id: pid })),
          )
          if (rpError) throw rpError
        }
        toast.success(
          editingRole?.is_system
            ? 'System role permissions updated'
            : 'Role updated successfully',
        )
        void writeAuditLog({
          action: 'role.updated',
          resource: 'roles',
          resourceId: selectedRole,
          oldValue: editingRole ? { name: editingRole.name, description: editingRole.description } : undefined,
          newValue: { name: formData.name, description: formData.description, permissionCount: permIds.length },
        })
      }
      await Promise.all([loadRoles(), loadRolePerms()])
      cancelEdit()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    if (!can('roles.delete')) {
      toast.error('You do not have permission to delete roles')
      setDeleteTarget(null)
      return
    }
    const targetRole = roles.find((r) => r.id === deleteTarget)
    try {
      const { error: permissionError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', deleteTarget)
      if (permissionError) throw permissionError
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('role_id', deleteTarget)
      if (userRoleError) throw userRoleError
      const { error } = await supabase.from('roles').delete().eq('id', deleteTarget)
      if (error) throw error
      toast.success('Role deleted')
      void writeAuditLog({
        action: 'role.deleted',
        resource: 'roles',
        resourceId: deleteTarget,
        oldValue: targetRole ? { name: targetRole.name, slug: targetRole.slug } : undefined,
        severity: 'critical',
      })
      await loadRoles()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const getRoleUsers = (roleId: string) => {
    return Object.entries(userRoles)
      .filter(([_, roles]) => roles.includes(roleId))
      .length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalPerms = roles.reduce((sum, r) => sum + (rolePerms[r.id]?.length ?? 0), 0)
  const totalUsers = Object.keys(userRoles).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise RBAC management</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="roles.read">
            <Button variant="outline" onClick={() => setShowUserManager(!showUserManager)}>
              <Users className="w-4 h-4 mr-1" />
              {showUserManager ? 'Permission Matrix' : 'User Manager'}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="roles.create">
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" /> Create Role
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Roles" value={roles.length} subtitle="configured roles" icon={Shield} accent="blue" />
        <MetricCard title="Total Permissions" value={totalPerms} subtitle="across all roles" icon={Check} accent="green" />
        <MetricCard title="Users with Roles" value={totalUsers} subtitle="assigned" icon={Users} accent="gold" />
      </div>

      {editMode && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">
            {editMode === 'create'
              ? 'Create New Role'
              : roles.find((r) => r.id === selectedRole)?.is_system
                ? 'Edit System Role Permissions'
                : 'Edit Role'}
          </h2>
          {roles.find((r) => r.id === selectedRole)?.is_system && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              System role name/slug cannot be changed. You can update permissions below.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Role Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Editor"
                disabled={editMode === 'edit' && roles.find((r) => r.id === selectedRole)?.is_system}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. editor"
                disabled={editMode === 'edit'}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Role description"
                disabled={editMode === 'edit' && roles.find((r) => r.id === selectedRole)?.is_system}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Assign Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {allPermissions.map(perm => (
                <label
                  key={perm.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    assignedPerms.has(perm.key)
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={assignedPerms.has(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{PERMISSION_LABELS[perm.key] ?? perm.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{perm.key}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {assignedPerms.size} permission{assignedPerms.size !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={saveRole} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : editMode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {roles.length === 0 && !editMode ? (
        <Empty title="No roles found" description="Create a new role to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map(role => {
            const permCount = rolePerms[role.id]?.length ?? 0
            const userCount = getRoleUsers(role.id)
            return (
              <div key={role.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground capitalize">{role.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{role.slug}</p>
                  </div>
                  <StatusBadge
                    status={role.is_system ? 'system' : 'active'}
                    variant={role.is_system ? 'destructive' : 'success'}
                  />
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{role.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {permCount} permissions</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {userCount} users</span>
                </div>
                <div className="flex gap-1">
                  <PermissionGuard permission="roles.update">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => startEdit(role)}
                      title={role.is_system ? 'Edit system role permissions' : 'Edit role'}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="roles.delete">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setDeleteTarget(role.id)}
                      disabled={role.is_system}
                      className="text-red-500 hover:text-red-600"
                      title={role.is_system ? 'System roles cannot be deleted' : 'Delete role'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Permission Matrix or User Manager */}
      {showUserManager ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Assign Roles to Users
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search users by email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUsers()}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={searchUsers} disabled={usersLoading} size="sm">
                {usersLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {users.length > 0 ? (
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.full_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {roleBadge(u.user_role)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => {
                        const hasRole = userRoles[u.id]?.includes(role.id)
                        return (
                          <button
                            key={role.id}
                            onClick={() => assignUserRole(u.id, role.id, !hasRole)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              hasRole
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {role.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="No users found" description="Search for users by email to assign roles." />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Permission Matrix</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click a cell to grant or revoke a permission. Works for system roles too.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Permission</th>
                  {roles.map(role => (
                    <th key={role.id} className="text-center px-2 py-3 font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${ROLE_COLORS[role.slug] ?? ''}`}>
                          {role.slug.replace(/_/g, ' ')}
                        </span>
                        {role.is_system && <Shield className="w-3 h-3 text-muted-foreground/50" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map(group => {
                  const isExpanded = expandedGroups[group.label] ?? false
                  return (
                    <Fragment key={`group-${group.label}`}>
                      <tr
                        key={`group-${group.label}`}
                        className="bg-muted/20 border-y border-border cursor-pointer hover:bg-muted/40"
                        onClick={() => toggleGroup(group.label)}
                      >
                        <td colSpan={roles.length + 1} className="px-4 py-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {group.label}
                            <span className="text-[10px] text-muted-foreground/50 font-normal normal-case">
                              ({group.permissions.length} permissions)
                            </span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && group.permissions.map(permKey => {
                        const perm = allPermissions.find(p => p.key === permKey)
                        return (
                          <tr key={permKey} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-2 text-sm text-foreground">
                              <div className="flex items-center gap-2">
                                <span>{PERMISSION_LABELS[permKey] ?? permKey}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{permKey}</span>
                              </div>
                            </td>
                            {roles.map(role => {
                              const has = perm ? rolePerms[role.id]?.includes(perm.id) : false
                              const canEdit =
                                can('permissions.assign') ||
                                can('roles.update') ||
                                can('permissions.manage')
                              return (
                                <td key={role.id} className="text-center px-2 py-2">
                                  <button
                                    type="button"
                                    disabled={!canEdit || !perm}
                                    title={
                                      canEdit
                                        ? has
                                          ? 'Revoke permission'
                                          : 'Grant permission'
                                        : 'No permission to edit'
                                    }
                                    onClick={() => void toggleMatrixPermission(role, permKey)}
                                    className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {has
                                      ? <Check className="w-4 h-4 text-green-600" />
                                      : <X className="w-4 h-4 text-muted-foreground/30" />
                                    }
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        title="Delete Role"
        description="This action cannot be undone. The role and all its permissions will be permanently removed. Users assigned this role will lose it."
        confirmLabel="Delete Role"
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      />
    </div>
  )
}

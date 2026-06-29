'use client'

import { useState, useTransition } from 'react'
import type { UserWithRole, RoleDefinition } from '@/types/domain'
import { Permission } from '@/lib/rbac/permissions'
import { listUsers, inviteUser, removeUser } from '@/app/actions/users'
import { listRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ── Permission label map (used in invite access preview) ─────────────────────

const PERM_LABEL: Record<Permission, string> = {
  'content:create':   'Create content',
  'content:edit':     'Edit content',
  'content:review':   'Review content',
  'content:publish':  'Publish content',
  'reporters:manage': 'Manage contributors',
  'ads:manage':       'Manage ads',
  'users:view':       'View users',
  'users:manage':     'Manage users',
  'finance:view':     'View finance',
  'analytics:view':   'View analytics',
  'org:configure':    'Configure org',
  'platform:manage':       'Platform admin',
  'notifications:manage':  'Send notifications',
}

// ── Sub-page / action permission matrix ───────────────────────────────────────

interface PermAction { label: string; perm: Permission }
interface PermPage   { page: string; actions: PermAction[] }
interface PermModule { module: string; pages: PermPage[] }

const MODULE_MATRIX: PermModule[] = [
  {
    module: 'Content',
    pages: [
      {
        page: 'All Content',
        actions: [
          { label: 'Create',  perm: Permission.CONTENT_CREATE  },
          { label: 'Edit',    perm: Permission.CONTENT_EDIT    },
          { label: 'Review',  perm: Permission.CONTENT_REVIEW  },
          { label: 'Publish', perm: Permission.CONTENT_PUBLISH },
        ],
      },
      {
        page: 'Live Management',
        actions: [{ label: 'Manage', perm: Permission.CONTENT_PUBLISH }],
      },
    ],
  },
  {
    module: 'Contributors',
    pages: [
      {
        page: 'Approvals · Earnings · Commission',
        actions: [{ label: 'Manage', perm: Permission.REPORTERS_MANAGE }],
      },
    ],
  },
  {
    module: 'Social Connect',
    pages: [
      { page: '', actions: [{ label: 'Publish', perm: Permission.CONTENT_PUBLISH }] },
    ],
  },
  {
    module: 'App Users',
    pages: [
      {
        page: '',
        actions: [
          { label: 'View',   perm: Permission.USERS_VIEW   },
          { label: 'Manage', perm: Permission.USERS_MANAGE },
        ],
      },
    ],
  },
  {
    module: 'Ads',
    pages: [
      {
        page: 'Campaigns · Slots · Performance',
        actions: [{ label: 'Manage', perm: Permission.ADS_MANAGE }],
      },
    ],
  },
  {
    module: 'Notifications',
    pages: [
      { page: '', actions: [{ label: 'Send', perm: Permission.CONTENT_PUBLISH }] },
    ],
  },
  {
    module: 'Analytics',
    pages: [
      { page: '', actions: [{ label: 'View', perm: Permission.ANALYTICS_VIEW }] },
    ],
  },
  {
    module: 'Finance',
    pages: [
      { page: '', actions: [{ label: 'View', perm: Permission.FINANCE_VIEW }] },
    ],
  },
  {
    module: 'Settings',
    pages: [
      { page: 'Users & Roles',           actions: [{ label: 'Manage',    perm: Permission.USERS_MANAGE    }] },
      { page: 'Master Data · Audit Log', actions: [{ label: 'Configure', perm: Permission.ORG_CONFIGURE   }] },
      { page: 'Platform',                actions: [{ label: 'Admin',     perm: Permission.PLATFORM_MANAGE }] },
    ],
  },
]

// ── Permission checkbox matrix ────────────────────────────────────────────────

function PermissionMatrix({
  selected,
  onChange,
}: {
  selected: Set<Permission>
  onChange: (p: Permission, checked: boolean) => void
}) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-md border divide-y text-sm">
      {MODULE_MATRIX.map(mod => (
        <div key={mod.module}>
          {/* Module header */}
          <div className="px-3 py-1.5 bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {mod.module}
          </div>
          {/* Sub-pages */}
          {mod.pages.map((pg, pgIdx) => (
            <div
              key={pgIdx}
              className="flex items-center gap-3 px-3 py-2 border-t hover:bg-muted/20 transition-colors"
            >
              {pg.page ? (
                <span className="w-44 shrink-0 text-xs text-muted-foreground">{pg.page}</span>
              ) : (
                <span className="w-44 shrink-0" />
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {pg.actions.map((action, actIdx) => (
                  <label
                    key={`${pgIdx}-${actIdx}`}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selected.has(action.perm)}
                      onChange={e => onChange(action.perm, e.target.checked)}
                    />
                    <span className="text-sm">{action.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Role editor dialog ────────────────────────────────────────────────────────

function RoleDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: RoleDefinition | null
  onClose: () => void
  onSaved: (roles: RoleDefinition[]) => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [selected, setSelected] = useState<Set<Permission>>(
    new Set((editing?.permissions ?? []) as Permission[]),
  )
  const [isPending, startTransition] = useTransition()

  const toggle = (p: Permission, checked: boolean) =>
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(p) : next.delete(p)
      return next
    })

  const syncState = (role: RoleDefinition | null) => {
    setName(role?.name ?? '')
    setSelected(new Set((role?.permissions ?? []) as Permission[]))
  }

  const handleSave = () => {
    const perms = [...selected] as Permission[]
    startTransition(async () => {
      const result = editing
        ? await updateRole({ id: editing.id, name, permissions: perms })
        : await createRole({ name, permissions: perms })

      if (!result.ok) {
        toast.error(result.error.message)
        return
      }

      const refreshed = await listRoles()
      onSaved(refreshed.ok ? refreshed.data : [])
      toast.success(editing ? 'Role updated' : 'Role created')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { syncState(editing); onClose() } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Regional Editor"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Permissions</Label>
            <PermissionMatrix selected={selected} onChange={toggle} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Roles tab ─────────────────────────────────────────────────────────────────

function RolesTab({
  roles,
  setRoles,
}: {
  roles: RoleDefinition[]
  setRoles: (r: RoleDefinition[]) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoleDefinition | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<RoleDefinition | null>(null)
  const [isPending, startTransition] = useTransition()

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (r: RoleDefinition) => { setEditing(r); setDialogOpen(true) }

  const handleDelete = (r: RoleDefinition) => {
    startTransition(async () => {
      const result = await deleteRole(r.id)
      if (!result.ok) { toast.error(result.error.message); return }
      const refreshed = await listRoles()
      setRoles(refreshed.ok ? refreshed.data : [])
      toast.success('Role deleted')
      setConfirmDelete(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} roles</p>
        <Button size="sm" onClick={openCreate}>+ New role</Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Permissions</th>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{role.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3">
                  {role.isSystem
                    ? <Badge variant="secondary" className="text-xs">System</Badge>
                    : <Badge variant="outline" className="text-xs">Custom</Badge>
                  }
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => openEdit(role)}
                  >
                    Edit
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(role)}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={setRoles}
      />

      <Dialog open={!!confirmDelete} onOpenChange={v => { if (!v) setConfirmDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{confirmDelete?.name}</strong>? Users assigned this role will lose
            their access.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  roles,
  setUsers,
}: {
  users: UserWithRole[]
  roles: RoleDefinition[]
  setUsers: (u: UserWithRole[]) => void
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: '' })
  const [isPending, startTransition] = useTransition()

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roleLabel = (id: string) => roles.find(r => r.id === id)?.name ?? id

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteUser(form)
      if (!result.ok) { toast.error(result.error.message); return }
      const refreshed = await listUsers()
      setUsers(refreshed.ok ? refreshed.data : [])
      toast.success('Invitation sent')
      setInviteOpen(false)
      setForm({ name: '', email: '', role: '' })
    })
  }

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeUser(userId)
      if (!result.ok) { toast.error(result.error.message); return }
      const refreshed = await listUsers()
      setUsers(refreshed.ok ? refreshed.data : [])
      toast.success('User removed')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Select value={roleFilter} onValueChange={v => v && setRoleFilter(v)}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setInviteOpen(true)}>+ Invite user</Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Email</th>
              <th className="px-4 py-2.5 text-left font-medium">Role</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs font-normal">
                    {roleLabel(user.role)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {user.joinedAt
                    ? <span className="text-xs text-emerald-600">Active</span>
                    : <span className="text-xs text-amber-600">Pending</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleRemove(user.id)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={v => { if (!v) setInviteOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => v && setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.role && (() => {
              const role = roles.find(r => r.id === form.role)
              if (!role || role.permissions.length === 0) return null
              return (
                <div className="rounded-md bg-muted/40 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Access preview</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map(p => (
                      <span key={p} className="text-xs bg-background border rounded px-1.5 py-0.5">
                        {PERM_LABEL[p as Permission] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={isPending}>Cancel</Button>
            <Button
              onClick={handleInvite}
              disabled={!form.name || !form.email || !form.role || isPending}
            >
              {isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export function UsersRolesClient({
  initialUsers,
  initialRoles,
}: {
  initialUsers: UserWithRole[]
  initialRoles: RoleDefinition[]
}) {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
  const [users, setUsers] = useState(initialUsers)
  const [roles, setRoles] = useState(initialRoles)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Users &amp; Roles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage roles, permissions, and team members
        </p>
      </div>

      <div className="border-b flex gap-0">
        {(['roles', 'users'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              activeTab === tab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab === 'roles' ? `Roles (${roles.length})` : `Users (${users.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && <RolesTab roles={roles} setRoles={setRoles} />}
      {activeTab === 'users' && <UsersTab users={users} roles={roles} setUsers={setUsers} />}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import type { UserWithRole, RoleDefinition } from '@/types/domain'
import {
  PERMISSION_CATALOG,
  type Capability,
  type CapabilityModule,
  type CapabilitySubmodule,
  type CapabilityPage,
} from '@/lib/rbac/permissions'
import { listUsers, inviteUser, removeUser } from '@/app/actions/users'
import { listRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Capability helpers ────────────────────────────────────────────────────────

const moduleCapabilities = (mod: CapabilityModule): Capability[] =>
  mod.submodules.flatMap(s => s.pages.flatMap(pg => pg.actions.map(a => a.capability)))

const submoduleCaps = (sub: CapabilitySubmodule): Capability[] =>
  sub.pages.flatMap(pg => pg.actions.map(a => a.capability))

const pageCaps = (pg: CapabilityPage): Capability[] =>
  pg.actions.map(a => a.capability)

// Capability for a given (page, column-key), or undefined if the page lacks it.
const cellCapability = (pg: CapabilityPage, colKey: string): Capability | undefined =>
  pg.actions.find(a => a.key === colKey)?.capability

// ── Permission editor: modules (left) → sub-module sections → pages table ─────

function PermissionEditor({
  selected,
  onChange,
}: {
  selected: Set<Capability>
  onChange: (next: Set<Capability>) => void
}) {
  const [activeId, setActiveId] = useState(PERMISSION_CATALOG[0]!.id)
  const active: CapabilityModule =
    PERMISSION_CATALOG.find(m => m.id === activeId) ?? PERMISSION_CATALOG[0]!

  const countOn = (caps: Capability[]) => caps.filter(c => selected.has(c)).length

  const setMany = (caps: Capability[], on: boolean) => {
    const next = new Set(selected)
    caps.forEach(c => (on ? next.add(c) : next.delete(c)))
    onChange(next)
  }

  const toggleCell = (cap: Capability, on: boolean) => setMany([cap], on)

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── Left: modules with toggle ────────────────────────────────────── */}
      <div className="w-48 shrink-0 border-r overflow-y-auto">
        {PERMISSION_CATALOG.map(mod => {
          const caps = moduleCapabilities(mod)
          const on = countOn(caps)
          const isActive = mod.id === activeId
          return (
            <div
              key={mod.id}
              onClick={() => setActiveId(mod.id)}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer border-l-2 transition-colors select-none',
                isActive
                  ? 'bg-primary/[0.07] border-primary'
                  : 'border-transparent text-foreground/80 hover:bg-muted/30',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('text-[13px] font-medium truncate', isActive && 'text-primary')}>
                  {mod.label}
                </span>
                {on > 0 && (
                  <span className={cn(
                    'shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}>
                    {on}
                  </span>
                )}
              </div>
              <Switch
                size="sm"
                checked={on > 0}
                onCheckedChange={(checked) => setMany(caps, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )
        })}
      </div>

      {/* ── Right: sub-module sections for the active module ──────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[13px] font-semibold text-foreground/60 uppercase tracking-wide">
            {active.label}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {active.submodules.length} sub-module{active.submodules.length !== 1 ? 's' : ''}
          </span>
        </div>

        {active.submodules.map(sub => {
          const caps = submoduleCaps(sub)
          const on = countOn(caps)
          const allOn = on === caps.length
          return (
            <div key={sub.id} className="rounded-lg border overflow-hidden">
              {/* Sub-module header with its own toggle */}
              <div className="flex items-center justify-between gap-2 bg-muted/50 px-4 py-2.5 border-b">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={allOn}
                    indeterminate={on > 0 && !allOn}
                    onCheckedChange={() => setMany(caps, !allOn)}
                  />
                  <span className="text-[13px] font-semibold text-foreground">{sub.label}</span>
                  {on > 0 && (
                    <span className="rounded-full bg-primary/10 text-primary px-1.5 py-px text-[10px] font-semibold tabular-nums">
                      {on}/{caps.length}
                    </span>
                  )}
                </div>
                <Switch
                  size="sm"
                  checked={on > 0}
                  onCheckedChange={(checked) => setMany(caps, checked as boolean)}
                />
              </div>

              {/* Pages table for this sub-module */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-background">
                      <th className="w-full px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Page
                      </th>
                      {active.actions.map(col => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sub.pages.map(pg => {
                      const pc = pageCaps(pg)
                      const pageOn = pc.every(c => selected.has(c))
                      const pageSome = pc.some(c => selected.has(c))
                      return (
                        <tr key={pg.id} className="hover:bg-muted/[0.15] transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                checked={pageOn}
                                indeterminate={!pageOn && pageSome}
                                onCheckedChange={() => setMany(pc, !pageOn)}
                              />
                              <span className="text-[13px] text-foreground/80 whitespace-nowrap">
                                {pg.label}
                              </span>
                            </div>
                          </td>
                          {active.actions.map(col => {
                            const cap = cellCapability(pg, col.key)
                            return (
                              <td key={col.key} className="px-3 py-2.5 text-center">
                                {cap ? (
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={selected.has(cap)}
                                      onCheckedChange={(v) => toggleCell(cap, v as boolean)}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/20 text-base select-none">—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
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
  const [selected, setSelected] = useState<Set<Capability>>(
    new Set(editing?.permissions ?? []),
  )
  const [isPending, startTransition] = useTransition()

  const syncState = (role: RoleDefinition | null) => {
    setName(role?.name ?? '')
    setSelected(new Set(role?.permissions ?? []))
  }

  const handleSave = () => {
    const perms = [...selected]
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
      <DialogContent className="!max-w-[min(960px,95vw)] w-[min(960px,95vw)] h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-base">
            {editing ? `Edit role — ${editing.name}` : 'New role'}
          </DialogTitle>
        </DialogHeader>

        {/* Role name */}
        <div className="px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-3 max-w-xs">
            <Label className="shrink-0 text-sm text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Regional Editor"
              className="h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Two-panel permission editor */}
        <PermissionEditor selected={selected} onChange={setSelected} />

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t shrink-0 bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              {selected.size} permission{selected.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!name.trim() || isPending}>
                {isPending ? 'Saving…' : 'Save role'}
              </Button>
            </div>
          </div>
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
  const openEdit   = (r: RoleDefinition) => { setEditing(r); setDialogOpen(true) }

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
                    variant="ghost" size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => openEdit(role)}
                  >
                    Edit
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost" size="sm"
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
          <DialogHeader><DialogTitle>Delete role</DialogTitle></DialogHeader>
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
                    variant="ghost" size="sm"
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
          <DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader>
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
              // Summarise granular capabilities by the module they belong to.
              const granted = new Set(role.permissions)
              const modules = PERMISSION_CATALOG
                .map(m => {
                  const caps = m.submodules.flatMap(s => s.pages.flatMap(pg => pg.actions.map(a => a.capability)))
                  const on = caps.filter(c => granted.has(c)).length
                  return { label: m.label, on, total: caps.length }
                })
                .filter(m => m.on > 0)
              return (
                <div className="rounded-md bg-muted/40 p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Access preview · {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {modules.map(m => (
                      <span key={m.label} className="text-xs bg-background border rounded px-1.5 py-0.5">
                        {m.label}
                        <span className="text-muted-foreground"> {m.on}/{m.total}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
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

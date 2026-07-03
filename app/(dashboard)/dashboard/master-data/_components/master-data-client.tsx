'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, MapPin,
  Layers, ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Languages,
  Upload, X, ImageIcon, Globe, Building2, Home, Dot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, Location, Language } from '@/types/domain'
import { LocationLevel, LOCATION_LEVEL_LABELS } from '@/types/domain'
import {
  createCategory, updateCategory, toggleCategory, deleteCategory,
  createLocation, updateLocation, toggleLocation, deleteLocation,
  createLanguage, updateLanguage, toggleLanguage, deleteLanguage,
} from '@/app/actions/ref-data'

// ── Local-state-only types (tags — server actions deferred) ──

interface ContentTag { id: string; name: string; slug: string; usageCount: number; active: boolean }

const SEED_TAGS: ContentTag[] = [
  { id: 't1',  name: 'Hyderabad',       slug: 'hyderabad',       usageCount: 48, active: true  },
  { id: 't2',  name: 'Telangana',       slug: 'telangana',       usageCount: 42, active: true  },
  { id: 't3',  name: 'GHMC',            slug: 'ghmc',            usageCount: 18, active: true  },
  { id: 't4',  name: 'Monsoon',         slug: 'monsoon',         usageCount: 24, active: true  },
  { id: 't5',  name: 'IPL',             slug: 'ipl',             usageCount: 12, active: true  },
  { id: 't6',  name: 'TSRTC',           slug: 'tsrtc',           usageCount: 9,  active: true  },
  { id: 't7',  name: 'Elections',       slug: 'elections',       usageCount: 31, active: true  },
  { id: 't8',  name: 'Real Estate',     slug: 'real-estate',     usageCount: 15, active: true  },
  { id: 't9',  name: 'Outer Ring Road', slug: 'outer-ring-road', usageCount: 7,  active: true  },
  { id: 't10', name: 'IT Sector',       slug: 'it-sector',       usageCount: 22, active: true  },
  { id: 't11', name: 'Musi River',      slug: 'musi-river',      usageCount: 6,  active: true  },
  { id: 't12', name: 'Old City',        slug: 'old-city',        usageCount: 11, active: true  },
  { id: 't13', name: 'Karimnagar',      slug: 'karimnagar',      usageCount: 8,  active: true  },
  { id: 't14', name: 'Warangal',        slug: 'warangal',        usageCount: 10, active: true  },
  { id: 't15', name: 'Flood Relief',    slug: 'flood-relief',    usageCount: 5,  active: false },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />Active</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input className="pl-9 h-9" placeholder={placeholder ?? 'Search…'} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function InlineActions({ onEdit, onToggle, onDelete, active }: {
  onEdit: () => void; onToggle: () => void; onDelete: () => void; active: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-amber-600" onClick={onToggle}>
        {active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-red-600" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
    </div>
  )
}

// ── Category image upload ─────────────────────────────────────────────────────

function CategoryImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const MAX = 400
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const r = Math.min(MAX / width, MAX / height)
          width = Math.round(width * r); height = Math.round(height * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        onChange(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const isUrl = value.startsWith('data:') || value.startsWith('http')
  if (value && isUrl) {
    return (
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Category" className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
        <div className="flex flex-col gap-1.5">
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => inputRef.current?.click()}>
            <Upload className="w-3 h-3" />Replace
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700 gap-1"
            onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = '' }}>
            <X className="w-3 h-3" />Remove
          </Button>
          <p className="text-[11px] text-gray-400">400×400px · max 5 MB</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }} />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f) }}
        onDragOver={e => e.preventDefault()}>
        <ImageIcon className="w-6 h-6 text-gray-400" />
        <p className="text-xs text-gray-500 font-medium">Click or drag to upload</p>
        <p className="text-[11px] text-gray-400">Square image · 400×400px recommended · max 5 MB<br/>JPG or PNG — auto-resized on upload</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }} />
      </div>
    </div>
  )
}

// ── Auto-generate code from name ──────────────────────────────────────────────

function nameToCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CAT'
}

// ── CATEGORIES TAB ────────────────────────────────────────────────────────────

type CatForm = { name: string; imageUrl: string; sortOrder: string }
const EMPTY_CAT: CatForm = { name: '', imageUrl: '', sortOrder: '' }

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function CategoriesTab({ initial }: { initial: Category[] }) {
  const [items, setItems] = useState<Category[]>(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CatForm>(EMPTY_CAT)
  const [pending, startTx] = useTransition()
  const [err, setErr] = useState('')

  const filtered = useMemo(() => items
    .filter(c => filter === 'all' || (filter === 'active' ? c.active : !c.active))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
  , [items, search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const pageEnd = Math.min(safePage * pageSize, filtered.length)

  const active = items.filter(c => c.active).length
  const inactive = items.filter(c => !c.active).length

  function resetPage() { setPage(1) }

  function openAdd() { setEditing(null); setForm(EMPTY_CAT); setErr(''); setOpen(true) }
  function openEdit(c: Category) {
    setEditing(c)
    const icon = c.icon ?? ''
    const imageUrl = icon.startsWith('data:') || icon.startsWith('http') ? icon : ''
    setForm({ name: c.name, imageUrl, sortOrder: String(c.sortOrder ?? '') })
    setErr(''); setOpen(true)
  }

  function save() {
    if (!form.name.trim()) { setErr('Name is required'); return }
    if (!form.imageUrl) { setErr('Category image is required'); return }
    if (!form.sortOrder || isNaN(Number(form.sortOrder)) || Number(form.sortOrder) < 1) { setErr('Display order is required (must be a number ≥ 1)'); return }
    setErr('')
    startTx(async () => {
      const code = editing?.code ?? nameToCode(form.name)
      const payload = { name: form.name.trim(), code }
      const extras = { icon: form.imageUrl, sortOrder: Number(form.sortOrder) }
      if (editing) {
        const r = await updateCategory(editing.id, payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => prev.map(c => c.id === editing.id ? { ...r.data, ...extras } : c))
      } else {
        const r = await createCategory(payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => [...prev, { ...r.data, ...extras }])
      }
      setOpen(false)
    })
  }

  function toggle(c: Category) {
    startTx(async () => {
      const r = await toggleCategory(c.id)
      if (r.ok) setItems(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x))
    })
  }

  function remove(c: Category) {
    startTx(async () => {
      const r = await deleteCategory(c.id)
      if (r.ok) setItems(prev => prev.filter(x => x.id !== c.id))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={v => { setSearch(v); resetPage() }} placeholder="Search categories…" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['all','active','inactive'] as const).map(f => (
              <button key={f} onClick={() => { setFilter(f); resetPage() }}
                className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
                {f === 'all' ? `All (${items.length})` : f === 'active' ? `Active (${active})` : `Inactive (${inactive})`}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" />Add Category</Button>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">Image</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No categories found</td></tr>}
            {visible.map((c) => (
              <tr key={c.id} className="group hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {c.icon && (c.icon.startsWith('data:') || c.icon.startsWith('http')) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-sm bg-gray-300" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{c.name}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs font-mono">{c.sortOrder ?? '—'}</td>
                <td className="px-4 py-3"><ActiveBadge active={c.active} /></td>
                <td className="px-4 py-3 text-right">
                  <InlineActions onEdit={() => openEdit(c)} onToggle={() => toggle(c)} onDelete={() => remove(c)} active={c.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); resetPage() }}>
            <SelectTrigger className="h-8 w-[70px] min-w-0 text-xs text-foreground font-medium rounded-lg bg-background border-input px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span>{filtered.length === 0 ? '0' : `${pageStart}–${pageEnd}`} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
            <span className="px-2">Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Local News" />
            </div>
            <div className="space-y-1.5">
              <Label>Category Image <span className="text-red-500">*</span></Label>
              <CategoryImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Display Order <span className="text-red-500">*</span></Label>
              <Input type="number" min={1} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="e.g. 1 — lower number = first in app" className="w-48" />
              <p className="text-[11px] text-gray-400">Lower number appears first in the app menu</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : editing ? 'Save Changes' : 'Add Category'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── LOCATIONS TAB ─────────────────────────────────────────────────────────────

interface TreeNode { loc: Location; children: TreeNode[] }

const LEVEL_CFG: Record<LocationLevel, { label: string; badge: string; icon: React.ReactNode; childLabel: string }> = {
  STATE:    { label: 'State',    badge: 'bg-blue-50 text-blue-700 border-blue-200',     icon: <Globe className="w-3.5 h-3.5" />,     childLabel: 'districts' },
  DISTRICT: { label: 'District', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Building2 className="w-3.5 h-3.5" />, childLabel: 'mandals'   },
  MANDAL:   { label: 'Mandal',   badge: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Home className="w-3.5 h-3.5" />,      childLabel: 'villages'  },
  VILLAGE:  { label: 'Village',  badge: 'bg-green-50 text-green-700 border-green-200',  icon: <Dot className="w-4 h-4" />,           childLabel: ''          },
}

function buildTree(locs: Location[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  for (const l of locs) nodeMap.set(l.id, { loc: l, children: [] })
  const roots: TreeNode[] = []
  for (const l of locs) {
    const node = nodeMap.get(l.id)!
    if (l.parentId) nodeMap.get(l.parentId)?.children.push(node)
    else roots.push(node)
  }
  const sort = (ns: TreeNode[]) => {
    ns.sort((a, b) => a.loc.name.localeCompare(b.loc.name))
    ns.forEach(n => sort(n.children))
  }
  sort(roots)
  return roots
}


type LocForm = { name: string; level: LocationLevel; parentId: string }
const EMPTY_LOC: LocForm = { name: '', level: LocationLevel.STATE, parentId: '' }

function LocationsTab({ initial }: { initial: Location[] }) {
  const [items, setItems] = useState<Location[]>(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  // Start collapsed — user expands each level
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState<LocForm>(EMPTY_LOC)
  const [pending, startTx] = useTransition()
  const [err, setErr] = useState('')
  const [toggleErr, setToggleErr] = useState('')

  // Build tree from all items
  const tree = useMemo(() => buildTree(items), [items])

  // Search state — which node IDs match and which are ancestors of matches
  const searchState = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const byId = new Map(items.map(l => [l.id, l]))
    const matchIds = new Set<string>()
    const ancestorIds = new Set<string>()
    for (const l of items) {
      if (!l.name.toLowerCase().includes(q)) continue
      matchIds.add(l.id)
      // Walk up and mark all ancestors
      let cur: Location | undefined = l
      while (cur?.parentId) {
        ancestorIds.add(cur.parentId)
        cur = byId.get(cur.parentId)
      }
    }
    return { matchIds, ancestorIds }
  }, [search, items])

  // Flatten tree for rendering — unified for both normal and search modes
  interface FlatRow { node: TreeNode; depth: number; isMatch: boolean }
  const flatRows = useMemo((): FlatRow[] => {
    const rows: FlatRow[] = []
    // In search mode, auto-expand all ancestor nodes so matches are visible
    const effectiveExpanded = searchState
      ? new Set([...expanded, ...searchState.ancestorIds])
      : expanded

    function walk(nodes: TreeNode[], depth: number) {
      for (const node of nodes) {
        const { loc } = node
        const statusOk = statusFilter === 'all'
          || (statusFilter === 'active' ? loc.active : !loc.active)
        const searchOk = !searchState
          || searchState.matchIds.has(loc.id)
          || searchState.ancestorIds.has(loc.id)
        if (statusOk && searchOk) {
          rows.push({ node, depth, isMatch: searchState ? searchState.matchIds.has(loc.id) : false })
        }
        if (effectiveExpanded.has(loc.id)) walk(node.children, depth + 1)
      }
    }
    walk(tree, 0)
    return rows
  }, [tree, expanded, statusFilter, searchState])

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const parents = useMemo(() => {
    const parentLevel: Record<LocationLevel, LocationLevel | null> = {
      STATE: null, DISTRICT: LocationLevel.STATE, MANDAL: LocationLevel.DISTRICT, VILLAGE: LocationLevel.MANDAL,
    }
    const lv = parentLevel[form.level]
    return lv ? items.filter(l => l.level === lv).sort((a, b) => a.name.localeCompare(b.name)) : []
  }, [items, form.level])

  function openAdd() { setEditing(null); setForm(EMPTY_LOC); setErr(''); setOpen(true) }
  function openEdit(l: Location) {
    setEditing(l); setForm({ name: l.name, level: l.level, parentId: l.parentId ?? '' }); setErr(''); setOpen(true)
  }

  function save() {
    if (!form.name.trim()) { setErr('Name is required'); return }
    if (form.level !== LocationLevel.STATE && !form.parentId) { setErr('Parent is required'); return }
    setErr('')
    const parent = items.find(l => l.id === form.parentId)
    startTx(async () => {
      const payload = { name: form.name.trim(), level: form.level, parentId: form.parentId || null, parentName: parent?.name ?? null }
      if (editing) {
        const r = await updateLocation(editing.id, payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => prev.map(l => l.id === editing.id ? r.data : l))
      } else {
        const r = await createLocation(payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => [...prev, r.data])
      }
      setOpen(false)
    })
  }

  function toggleActive(l: Location) {
    setToggleErr('')
    const toInactive = l.active
    // Descendants that are currently active (only relevant when deactivating)
    function collectActiveDescendants(pid: string): string[] {
      return items
        .filter(x => x.parentId === pid && x.active)
        .flatMap(c => [c.id, ...collectActiveDescendants(c.id)])
    }
    const cascadeIds = toInactive ? collectActiveDescendants(l.id) : []

    startTx(async () => {
      // toggleLocation flips the state — use it for the root node
      const r = await toggleLocation(l.id)
      if (!r.ok) { setToggleErr(r.error.message); return }
      // Cascade deactivate active descendants (each toggles active→inactive)
      const results = await Promise.all(cascadeIds.map(id => toggleLocation(id)))
      const failedCascade = results.filter(res => !res.ok)
      if (failedCascade.length) setToggleErr(`${failedCascade.length} child locations could not be updated`)

      const successIds = new Set([l.id, ...cascadeIds.filter((_, i) => results[i]?.ok)])
      setItems(prev => prev.map(x => {
        if (x.id === l.id) return { ...x, active: !l.active }
        if (cascadeIds.includes(x.id) && successIds.has(x.id)) return { ...x, active: false }
        return x
      }))
      // Collapse deactivated node so empty tree branch closes
      if (toInactive) setExpanded(prev => { const s = new Set(prev); s.delete(l.id); return s })
    })
  }

  function remove(l: Location) {
    startTx(async () => {
      const r = await deleteLocation(l.id)
      if (r.ok) setItems(prev => prev.filter(x => x.id !== l.id))
    })
  }

  const activeCount = items.filter(l => l.active).length
  const inactiveCount = items.filter(l => !l.active).length

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-9 h-9" placeholder="Search state, district, mandal, village…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {([['all', `All (${items.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]] as const).map(([f, label]) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                  statusFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="w-4 h-4" />Add Location
        </Button>
      </div>

      {toggleErr && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{toggleErr}</p>
      )}

      {/* Search hint */}
      {searchState && (
        <p className="text-xs text-gray-500">
          {searchState.matchIds.size === 0
            ? `No locations match "${search}"`
            : `${searchState.matchIds.size} match${searchState.matchIds.size > 1 ? 'es' : ''} for "${search}" — ancestors shown for context. Click ▶ to expand.`}
        </p>
      )}

      {/* ── Unified tree ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide"
          style={{ gridTemplateColumns: '1fr 100px 90px 96px' }}>
          <div className="px-4 py-2.5">Location</div>
          <div className="px-3 py-2.5">Children</div>
          <div className="px-3 py-2.5">Status</div>
          <div className="px-3 py-2.5 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-100">
          {flatRows.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {searchState ? `No locations match "${search}"` : 'No locations found'}
            </div>
          )}
          {flatRows.map(({ node, depth, isMatch }) => {
            const { loc, children } = node
            const cfg = LEVEL_CFG[loc.level]
            const isExpanded = expanded.has(loc.id)
              || (!!searchState && searchState.ancestorIds.has(loc.id))
            const hasChildren = children.length > 0

            return (
              <div key={loc.id}
                className={cn(
                  'grid items-center hover:bg-gray-50/60 transition-colors group',
                  !loc.active && 'opacity-60',
                  isMatch && 'bg-yellow-50/60 border-l-2 border-yellow-400'
                )}
                style={{ gridTemplateColumns: '1fr 100px 90px 96px' }}>

                {/* Name cell */}
                <div className="px-3 py-2.5 flex items-center gap-1.5 min-w-0"
                  style={{ paddingLeft: `${12 + depth * 22}px` }}>
                  <button
                    onClick={() => hasChildren && toggleExpand(loc.id)}
                    className={cn(
                      'w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-colors',
                      hasChildren ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-200' : 'cursor-default'
                    )}>
                    {hasChildren
                      ? isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      : <span className="w-3.5 h-3.5 block" />}
                  </button>

                  <span className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border', cfg.badge)}>
                    {cfg.icon}
                  </span>

                  <span className={cn('text-sm font-medium truncate', loc.active ? 'text-gray-900' : 'text-gray-400',
                    isMatch && 'text-yellow-800 font-semibold')}>
                    {loc.name}
                  </span>
                  {isMatch && (
                    <span className={cn('ml-1 text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0', cfg.badge)}>
                      {cfg.label}
                    </span>
                  )}
                </div>

                {/* Children count */}
                <div className="px-3 py-2.5 text-xs text-gray-400">
                  {hasChildren ? `${children.length} ${cfg.childLabel}` : '—'}
                </div>

                {/* Status */}
                <div className="px-3 py-2.5">
                  <ActiveBadge active={loc.active} />
                </div>

                {/* Actions */}
                <div className="px-3 py-2.5 flex justify-end">
                  <InlineActions
                    onEdit={() => openEdit(loc)}
                    onToggle={() => toggleActive(loc)}
                    onDelete={() => remove(loc)}
                    active={loc.active}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add / Edit dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kondapur" />
            </div>
            <div className="space-y-1.5">
              <Label>Level <span className="text-red-500">*</span></Label>
              <Select value={form.level} onValueChange={v => setForm(() => ({ name: form.name, level: v as LocationLevel, parentId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(LocationLevel).map(lv => (
                    <SelectItem key={lv} value={lv}>{LOCATION_LEVEL_LABELS[lv]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.level !== LocationLevel.STATE && (
              <div className="space-y-1.5">
                <Label>Parent {form.level} <span className="text-red-500">*</span></Label>
                <Select value={form.parentId} onValueChange={v => setForm(f => ({ ...f, parentId: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder={`Select parent ${LOCATION_LEVEL_LABELS[({ STATE: LocationLevel.STATE, DISTRICT: LocationLevel.STATE, MANDAL: LocationLevel.DISTRICT, VILLAGE: LocationLevel.MANDAL } as Record<LocationLevel, LocationLevel>)[form.level]]}…`} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {parents.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending}>
              {pending ? 'Saving…' : editing ? 'Save Changes' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── LANGUAGES TAB ─────────────────────────────────────────────────────────────

type LangForm = { name: string; code: string; direction: 'ltr' | 'rtl'; sortOrder: string }
const EMPTY_LANG: LangForm = { name: '', code: '', direction: 'ltr', sortOrder: '' }

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', te: '🇮🇳', hi: '🇮🇳', kn: '🇮🇳', ta: '🇮🇳', ur: '🇵🇰',
  ml: '🇮🇳', mr: '🇮🇳', bn: '🇧🇩', gu: '🇮🇳', pa: '🇮🇳', or: '🇮🇳', ar: '🇸🇦',
}

function LanguagesTab({ initial }: { initial: Language[] }) {
  const [items, setItems] = useState<Language[]>(initial)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Language | null>(null)
  const [form, setForm] = useState<LangForm>(EMPTY_LANG)
  const [pending, startTx] = useTransition()
  const [err, setErr] = useState('')

  const visible = useMemo(() => items
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name))
  , [items, search])

  function openAdd() { setEditing(null); setForm(EMPTY_LANG); setErr(''); setOpen(true) }
  function openEdit(l: Language) {
    setEditing(l); setForm({ name: l.name, code: l.code, direction: l.direction ?? 'ltr', sortOrder: String(l.sortOrder ?? '') }); setErr(''); setOpen(true)
  }

  function save() {
    if (!form.name.trim() || !form.code.trim()) { setErr('Name and code are required'); return }
    if (!form.sortOrder || isNaN(Number(form.sortOrder)) || Number(form.sortOrder) < 1) { setErr('Priority is required (must be a number ≥ 1)'); return }
    setErr('')
    const sortOrder = Number(form.sortOrder)
    startTx(async () => {
      const payload = { name: form.name.trim(), code: form.code.trim().toLowerCase() }
      if (editing) {
        const r = await updateLanguage(editing.id, payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => prev.map(l => l.id === editing.id ? { ...r.data, direction: form.direction, sortOrder } : l))
      } else {
        const r = await createLanguage(payload)
        if (!r.ok) { setErr(r.error.message); return }
        setItems(prev => [...prev, { ...r.data, direction: form.direction, sortOrder }])
      }
      setOpen(false)
    })
  }

  function toggle(l: Language) {
    startTx(async () => {
      const r = await toggleLanguage(l.id)
      if (r.ok) setItems(prev => prev.map(x => x.id === l.id ? { ...x, active: !x.active } : x))
    })
  }

  function remove(l: Language) {
    startTx(async () => {
      const r = await deleteLanguage(l.id)
      if (r.ok) setItems(prev => prev.filter(x => x.id !== l.id))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search languages…" />
        <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" />Add Language</Button>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Direction</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No languages found</td></tr>}
            {visible.map(l => (
              <tr key={l.id} className="group hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{LANG_FLAGS[l.code] ?? '🌐'}</span>
                    <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded uppercase">{l.code}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3">
                  {l.direction === 'rtl'
                    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">RTL</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">LTR</span>
                  }
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs font-mono">{l.sortOrder ?? '—'}</td>
                <td className="px-4 py-3"><ActiveBadge active={l.active} /></td>
                <td className="px-4 py-3 text-right">
                  <InlineActions onEdit={() => openEdit(l)} onToggle={() => toggle(l)} onDelete={() => remove(l)} active={l.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Language' : 'Add Language'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Language Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Telugu" />
              </div>
              <div className="space-y-1.5">
                <Label>ISO 639-1 Code <span className="text-red-500">*</span></Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase() }))} placeholder="e.g. te" maxLength={3} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Script Direction</Label>
                <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v as 'ltr' | 'rtl' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltr">LTR — Left to Right</SelectItem>
                    <SelectItem value="rtl">RTL — Right to Left (Arabic, Urdu)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority <span className="text-red-500">*</span></Label>
                <Input type="number" min={1} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="e.g. 1" />
                <p className="text-[11px] text-gray-400">Lower = higher priority in app</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : editing ? 'Save Changes' : 'Add Language'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── TAGS TAB ──────────────────────────────────────────────────────────────────

function slugify(s: string) { return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }

function TagsTab() {
  const [items, setItems] = useState<ContentTag[]>(SEED_TAGS)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContentTag | null>(null)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const visible = useMemo(() => items
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()))
    .sort((a, b) => b.usageCount - a.usageCount)
  , [items, search])

  function openAdd() { setEditing(null); setName(''); setErr(''); setOpen(true) }
  function openEdit(t: ContentTag) { setEditing(t); setName(t.name); setErr(''); setOpen(true) }

  function save() {
    if (!name.trim()) { setErr('Tag name is required'); return }
    setErr('')
    if (editing) {
      setItems(prev => prev.map(t => t.id === editing.id ? { ...t, name: name.trim(), slug: slugify(name) } : t))
    } else {
      setItems(prev => [...prev, { id: `t${Date.now()}`, name: name.trim(), slug: slugify(name), usageCount: 0, active: true }])
    }
    setOpen(false)
  }

  function toggle(t: ContentTag) { setItems(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x)) }
  function remove(t: ContentTag) { setItems(prev => prev.filter(x => x.id !== t.id)) }

  const totalUses = items.reduce((s, t) => s + t.usageCount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search tags…" />
          <p className="text-xs text-gray-500">{items.length} tags · {totalUses} total uses</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" />Add Tag</Button>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tag</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-40">Usage</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No tags found</td></tr>}
            {visible.map(t => (
              <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    <Tag className="w-3 h-3" />{t.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (t.usageCount / 50) * 100)}%` }} />
                    </div>
                    <span className="text-gray-600 text-xs w-6 text-right">{t.usageCount}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><ActiveBadge active={t.active} /></td>
                <td className="px-4 py-3 text-right"><InlineActions onEdit={() => openEdit(t)} onToggle={() => toggle(t)} onDelete={() => remove(t)} active={t.active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Tag' : 'Add Tag'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div className="space-y-1.5">
              <Label>Tag Name <span className="text-red-500">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hyderabad" />
            </div>
            {name && <p className="text-xs text-gray-500">Slug: <span className="font-mono bg-gray-100 px-1 rounded">{slugify(name)}</span></p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save Changes' : 'Add Tag'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

type TabId = 'categories' | 'locations' | 'languages' | 'tags'

interface MasterDataClientProps {
  categories: Category[]
  locations: Location[]
  languages: Language[]
}

export function MasterDataClient({ categories, locations, languages }: MasterDataClientProps) {
  const [tab, setTab] = useState<TabId>('categories')

  const TABS: { id: TabId; label: string; icon: React.ReactNode; count: number; description: string }[] = [
    { id: 'categories', label: 'Categories',   icon: <Layers className="w-4 h-4" />,   count: categories.length, description: 'Content categories displayed in the app menu' },
    { id: 'locations',  label: 'Locations',    icon: <MapPin className="w-4 h-4" />,    count: locations.length,  description: 'India geography hierarchy — State › District › Mandal › Village' },
    { id: 'languages',  label: 'Languages',    icon: <Languages className="w-4 h-4" />, count: languages.length,  description: 'Supported content languages for publishing and the app UI' },
    { id: 'tags',       label: 'Content Tags', icon: <Tag className="w-4 h-4" />,       count: SEED_TAGS.length,  description: 'Curated tag pool for consistent content tagging' },
  ]

  const current = TABS.find(t => t.id === tab)!

  const locActive = useMemo(() => ({
    DISTRICT: locations.filter(l => l.level === LocationLevel.DISTRICT && l.active).length,
    MANDAL:   locations.filter(l => l.level === LocationLevel.MANDAL   && l.active).length,
    VILLAGE:  locations.filter(l => l.level === LocationLevel.VILLAGE  && l.active).length,
  }), [locations])

  const inactiveCategories = categories.filter(c => !c.active).length
  const inactiveLanguages = languages.filter(l => !l.active).length
  const warnings: string[] = []
  if (inactiveCategories > 0) warnings.push(`${inactiveCategories} inactive categor${inactiveCategories > 1 ? 'ies' : 'y'}`)
  if (inactiveLanguages > 0) warnings.push(`${inactiveLanguages} inactive language${inactiveLanguages > 1 ? 's' : ''}`)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
        <p className="text-gray-500 mt-1">Reference data used across the platform — categories, locations, languages and tags</p>
      </div>

      {warnings.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Heads up: {warnings.join(', ')} — inactive items are hidden in the app</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm',
              tab === t.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className={cn('mb-2', tab === t.id ? 'text-blue-600' : 'text-gray-400')}>{t.icon}</div>
            <div className={cn('text-2xl font-bold tabular-nums', tab === t.id ? 'text-blue-700' : 'text-gray-900')}>{t.count}</div>
            <div className={cn('text-xs font-medium mt-0.5', tab === t.id ? 'text-blue-600' : 'text-gray-500')}>{t.label}</div>
            {t.id === 'locations' && (
              <div className="mt-1.5 space-y-0.5">
                <div className="text-[10px] text-gray-400 leading-tight">{locActive.DISTRICT} districts active</div>
                <div className="text-[10px] text-gray-400 leading-tight">{locActive.MANDAL} mandals active</div>
                <div className="text-[10px] text-gray-400 leading-tight">{locActive.VILLAGE} villages active</div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </div>

      <p className="text-sm text-gray-500 -mt-2">{current.description}</p>

      {tab === 'categories' && <CategoriesTab initial={categories} />}
      {tab === 'locations'  && <LocationsTab initial={locations} />}
      {tab === 'languages'  && <LanguagesTab initial={languages} />}
      {tab === 'tags'       && <TagsTab />}
    </div>
  )
}

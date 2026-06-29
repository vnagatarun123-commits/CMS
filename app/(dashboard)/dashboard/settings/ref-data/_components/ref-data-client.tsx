'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Category, Location, Language } from '@/types/domain'
import {
  createCategory, updateCategory, toggleCategory, deleteCategory,
  createLocation, updateLocation, toggleLocation, deleteLocation,
  createLanguage, updateLanguage, toggleLanguage, deleteLanguage,
} from '@/app/actions/ref-data'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── Ref item type ─────────────────────────────────────────────────────────────

type RefItem = Category | Location | Language

// ── Status badge ──────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs text-muted-foreground">
      Inactive
    </Badge>
  )
}

// ── Add/Edit dialog ───────────────────────────────────────────────────────────

interface RefItemDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: RefItem | null
  onSubmit: (name: string, slug: string) => Promise<void>
  pending: boolean
  tabLabel: string
}

function RefItemDialog({ open, onOpenChange, item, onSubmit, pending, tabLabel }: RefItemDialogProps) {
  const isEdit = Boolean(item)
  const [name, setName] = useState(item?.name ?? '')
  const [slug, setSlug] = useState(item?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setSlug(item?.slug ?? '')
      setSlugTouched(Boolean(item))
    }
  }, [open, item])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(toSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(toSlug(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(name.trim(), slug.trim() || toSlug(name))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${tabLabel}` : `Add ${tabLabel}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rdi-name">Name</Label>
            <Input
              id="rdi-name"
              placeholder="e.g. Sports"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rdi-slug">Slug</Label>
            <Input
              id="rdi-slug"
              placeholder="auto-generated"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Generic ref-data tab ──────────────────────────────────────────────────────

interface RefTabProps<T extends RefItem> {
  items: T[]
  tabLabel: string
  onAdd: (name: string, slug: string) => Promise<void>
  onEdit: (item: T, name: string, slug: string) => Promise<void>
  onToggle: (item: T) => Promise<void>
  onDelete: (item: T) => Promise<void>
}

function RefTab<T extends RefItem>({
  items,
  tabLabel,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: RefTabProps<T>) {
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<T | null>(null)
  const [pending, startTransition] = useTransition()

  const columns: ColumnDef<T>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ getValue }) => (
        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {getValue<string>()}
        </code>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-xs text-muted-foreground whitespace-nowrap">
          {getValue<Date>().toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setEditTarget(row.original)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                startTransition(async () => {
                  await onToggle(row.original)
                })
              }}
              className="cursor-pointer"
            >
              {row.original.active ? (
                <><ToggleLeft className="mr-2 h-4 w-4" />Deactivate</>
              ) : (
                <><ToggleRight className="mr-2 h-4 w-4" />Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                startTransition(async () => {
                  await onDelete(row.original)
                })
              }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add {tabLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border bg-card flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No {tabLabel.toLowerCase()}s yet. Add one above.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={items} pageSize={25} />
      )}

      <RefItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tabLabel={tabLabel}
        pending={pending}
        onSubmit={async (name, slug) => {
          await onAdd(name, slug)
          setAddOpen(false)
        }}
      />

      {editTarget && (
        <RefItemDialog
          open={editTarget !== null}
          onOpenChange={v => { if (!v) setEditTarget(null) }}
          item={editTarget}
          tabLabel={tabLabel}
          pending={pending}
          onSubmit={async (name, slug) => {
            await onEdit(editTarget, name, slug)
            setEditTarget(null)
          }}
        />
      )}
    </div>
  )
}

// ── Tab navigation ────────────────────────────────────────────────────────────

type TabId = 'categories' | 'locations' | 'languages'

const TABS: { id: TabId; label: string }[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'locations',  label: 'Locations' },
  { id: 'languages',  label: 'Languages' },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface RefDataClientProps {
  initialCategories: Category[]
  initialLocations: Location[]
  initialLanguages: Language[]
}

// ── Main component ────────────────────────────────────────────────────────────

export function RefDataClient({
  initialCategories,
  initialLocations,
  initialLanguages,
}: RefDataClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('categories')

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [languages, setLanguages] = useState<Language[]>(initialLanguages)

  function refresh() {
    router.refresh()
  }

  // ── Category handlers ────────────────────────────────────────────────────

  async function handleAddCategory(name: string, slug: string) {
    const result = await createCategory({ name, slug })
    if (result.ok) {
      toast.success(`Category "${result.data.name}" created`)
      setCategories(prev => [...prev, result.data])
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleEditCategory(item: Category, name: string, slug: string) {
    const result = await updateCategory(item.id, { name, slug })
    if (result.ok) {
      toast.success(`Category "${result.data.name}" updated`)
      setCategories(prev => prev.map(c => c.id === item.id ? result.data : c))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleToggleCategory(item: Category) {
    const result = await toggleCategory(item.id)
    if (result.ok) {
      toast.success(`Category "${result.data.name}" ${result.data.active ? 'activated' : 'deactivated'}`)
      setCategories(prev => prev.map(c => c.id === item.id ? result.data : c))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleDeleteCategory(item: Category) {
    const result = await deleteCategory(item.id)
    if (result.ok) {
      toast.success(`Category "${item.name}" deleted`)
      setCategories(prev => prev.filter(c => c.id !== item.id))
    } else {
      toast.error(result.error.message)
    }
  }

  // ── Location handlers ────────────────────────────────────────────────────

  async function handleAddLocation(name: string, slug: string) {
    const result = await createLocation({ name, slug })
    if (result.ok) {
      toast.success(`Location "${result.data.name}" created`)
      setLocations(prev => [...prev, result.data])
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleEditLocation(item: Location, name: string, slug: string) {
    const result = await updateLocation(item.id, { name, slug })
    if (result.ok) {
      toast.success(`Location "${result.data.name}" updated`)
      setLocations(prev => prev.map(l => l.id === item.id ? result.data : l))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleToggleLocation(item: Location) {
    const result = await toggleLocation(item.id)
    if (result.ok) {
      toast.success(`Location "${result.data.name}" ${result.data.active ? 'activated' : 'deactivated'}`)
      setLocations(prev => prev.map(l => l.id === item.id ? result.data : l))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleDeleteLocation(item: Location) {
    const result = await deleteLocation(item.id)
    if (result.ok) {
      toast.success(`Location "${item.name}" deleted`)
      setLocations(prev => prev.filter(l => l.id !== item.id))
    } else {
      toast.error(result.error.message)
    }
  }

  // ── Language handlers ────────────────────────────────────────────────────

  async function handleAddLanguage(name: string, slug: string) {
    const result = await createLanguage({ name, slug })
    if (result.ok) {
      toast.success(`Language "${result.data.name}" created`)
      setLanguages(prev => [...prev, result.data])
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleEditLanguage(item: Language, name: string, slug: string) {
    const result = await updateLanguage(item.id, { name, slug })
    if (result.ok) {
      toast.success(`Language "${result.data.name}" updated`)
      setLanguages(prev => prev.map(l => l.id === item.id ? result.data : l))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleToggleLanguage(item: Language) {
    const result = await toggleLanguage(item.id)
    if (result.ok) {
      toast.success(`Language "${result.data.name}" ${result.data.active ? 'activated' : 'deactivated'}`)
      setLanguages(prev => prev.map(l => l.id === item.id ? result.data : l))
    } else {
      toast.error(result.error.message)
    }
  }

  async function handleDeleteLanguage(item: Language) {
    const result = await deleteLanguage(item.id)
    if (result.ok) {
      toast.success(`Language "${item.name}" deleted`)
      setLanguages(prev => prev.filter(l => l.id !== item.id))
    } else {
      toast.error(result.error.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reference Data"
        description="Manage categories, locations, and languages used across content."
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'categories' && (
        <RefTab
          items={categories}
          tabLabel="Category"
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
          onToggle={handleToggleCategory}
          onDelete={handleDeleteCategory}
        />
      )}
      {activeTab === 'locations' && (
        <RefTab
          items={locations}
          tabLabel="Location"
          onAdd={handleAddLocation}
          onEdit={handleEditLocation}
          onToggle={handleToggleLocation}
          onDelete={handleDeleteLocation}
        />
      )}
      {activeTab === 'languages' && (
        <RefTab
          items={languages}
          tabLabel="Language"
          onAdd={handleAddLanguage}
          onEdit={handleEditLanguage}
          onToggle={handleToggleLanguage}
          onDelete={handleDeleteLanguage}
        />
      )}
    </div>
  )
}

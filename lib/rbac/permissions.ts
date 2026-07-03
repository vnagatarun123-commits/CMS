export const Role = {
  SUPER_ADMIN:       'SUPER_ADMIN',
  ORG_ADMIN:         'ORG_ADMIN',
  EDITOR:            'EDITOR',
  CONTENT_REVIEWER:  'CONTENT_REVIEWER',
  REPORTER_MANAGER:  'REPORTER_MANAGER',
  AD_MANAGER:        'AD_MANAGER',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  FINANCE_MANAGER:   'FINANCE_MANAGER',
  SUPPORT_EXECUTIVE: 'SUPPORT_EXECUTIVE',
  ANALYTICS_VIEWER:  'ANALYTICS_VIEWER',
  REPORTER:          'REPORTER',
} as const

export type Role = (typeof Role)[keyof typeof Role]

// ── Coarse capabilities (enforcement primitives) ──────────────────────────────
// These remain the primitives every server action / guard checks. With the
// granular layer below, `can(user, <coarse>)` is DERIVED: true iff the user holds
// at least one granular capability that belongs to this coarse group. This keeps
// every existing call site working while roles are stored granularly.

export const Permission = {
  CONTENT_CREATE:  'content:create',
  CONTENT_EDIT:    'content:edit',
  CONTENT_REVIEW:  'content:review',
  CONTENT_PUBLISH: 'content:publish',
  REPORTERS_MANAGE:'reporters:manage',
  ADS_MANAGE:      'ads:manage',
  USERS_VIEW:      'users:view',
  USERS_MANAGE:    'users:manage',
  FINANCE_VIEW:    'finance:view',
  ANALYTICS_VIEW:  'analytics:view',
  ORG_CONFIGURE:   'org:configure',
  PLATFORM_MANAGE:        'platform:manage',
  NOTIFICATIONS_MANAGE:   'notifications:manage',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

// ── Granular permission catalog ───────────────────────────────────────────────
// Four levels: MODULE → SUB-MODULE → PAGE → ACTION.
//   • module    = sidebar item (has a toggle in the builder)
//   • submodule = a section within the module (has its own toggle / section header)
//   • page      = a row in the section's table (a specific screen / status view)
//   • action    = a column checkbox (View, Create, …)
// Each action is a distinct capability string `module.page:action` (page ids are
// unique within a module). It maps to the coarse permission that enforces it.
// Single source of truth for the builder UI, derivation, nav gating, validation.

export interface CapabilityAction {
  key: string           // column key within a module, e.g. 'create'
  label: string         // 'Create'
  capability: string    // full granular key, e.g. 'content.drafts:create'
  permission: Permission // coarse group used for enforcement/derivation
}

export interface CapabilityPage {
  id: string            // page id (unique within the module)
  label: string
  actions: CapabilityAction[]
}

export interface CapabilitySubmodule {
  id: string            // submodule id (unique within the module)
  label: string
  pages: CapabilityPage[]
}

export interface CapabilityModule {
  id: string
  label: string
  actions: CapabilityAction[]        // union of action columns across the module
  submodules: CapabilitySubmodule[]
}

// Compact authoring form → expanded to CapabilityModule[] below.
type RawAction    = { key: string; label: string; permission: Permission }
type RawPage      = { id: string; label: string; actions: RawAction[] }
type RawSubmodule = { id: string; label: string; pages: RawPage[] }
type RawModule    = { id: string; label: string; submodules: RawSubmodule[] }

const C = Permission

// Reusable content action factories (map to the content:* coarse permissions).
const cView    = (): RawAction => ({ key: 'view',    label: 'View',    permission: C.CONTENT_EDIT })
const cCreate  = (): RawAction => ({ key: 'create',  label: 'Create',  permission: C.CONTENT_CREATE })
const cEdit    = (): RawAction => ({ key: 'edit',    label: 'Edit',    permission: C.CONTENT_EDIT })
const cReview  = (): RawAction => ({ key: 'review',  label: 'Review',  permission: C.CONTENT_REVIEW })
const cPublish = (): RawAction => ({ key: 'publish', label: 'Publish', permission: C.CONTENT_PUBLISH })
const cDelete  = (): RawAction => ({ key: 'delete',  label: 'Delete',  permission: C.CONTENT_EDIT })

// Generic action factory for single-coarse modules.
const act = (key: string, label: string, permission: Permission): RawAction => ({ key, label, permission })

const RAW_CATALOG: RawModule[] = [
  {
    id: 'content',
    label: 'Content',
    submodules: [
      {
        id: 'all',
        label: 'All Content',
        pages: [
          { id: 'all',           label: 'All',                 actions: [cView(), cCreate(), cEdit(), cReview(), cPublish(), cDelete()] },
          { id: 'drafts',        label: 'Drafts',              actions: [cView(), cCreate(), cEdit(), cDelete()] },
          { id: 'underreview',   label: 'Under Review',        actions: [cView(), cReview()] },
          { id: 'clarification', label: 'Needs Clarification', actions: [cView(), cEdit(), cReview()] },
          { id: 'scheduled',     label: 'Scheduled',           actions: [cView(), cEdit(), cPublish()] },
          { id: 'published',     label: 'Published',           actions: [cView(), cEdit(), cDelete()] },
        ],
      },
      {
        id: 'live',
        label: 'Live Streams',
        pages: [
          { id: 'livescheduled', label: 'Scheduled',   actions: [cView(), cCreate(), cEdit(), cPublish(), cDelete()] },
          { id: 'livenow',       label: 'Live Now',    actions: [cView(), cEdit(), cPublish()] },
          { id: 'past',          label: 'Past Streams',actions: [cView(), cDelete()] },
        ],
      },
    ],
  },
  {
    id: 'social',
    label: 'Social Connect',
    submodules: [
      {
        id: 'channels',
        label: 'Channels',
        pages: [
          { id: 'connected',  label: 'Connected Accounts', actions: [act('view', 'View', C.CONTENT_PUBLISH), act('manage', 'Manage', C.CONTENT_PUBLISH)] },
          { id: 'addchannel', label: 'Add Channel',        actions: [act('view', 'View', C.CONTENT_PUBLISH), act('create', 'Connect', C.CONTENT_PUBLISH)] },
        ],
      },
      {
        id: 'publishing',
        label: 'Publishing',
        pages: [
          { id: 'queue',   label: 'Queue',        actions: [act('view', 'View', C.CONTENT_PUBLISH), act('publish', 'Publish', C.CONTENT_PUBLISH), act('schedule', 'Schedule', C.CONTENT_PUBLISH)] },
          { id: 'history', label: 'Post History', actions: [act('view', 'View', C.CONTENT_PUBLISH), act('export', 'Export', C.CONTENT_PUBLISH)] },
        ],
      },
    ],
  },
  {
    id: 'contributors',
    label: 'Contributors',
    submodules: [
      {
        id: 'list',
        label: 'Contributors List',
        pages: [
          { id: 'all',       label: 'All Contributors', actions: [act('view', 'View', C.REPORTERS_MANAGE), act('create', 'Create', C.REPORTERS_MANAGE), act('edit', 'Edit', C.REPORTERS_MANAGE), act('delete', 'Delete', C.REPORTERS_MANAGE)] },
          { id: 'suspended', label: 'Suspended',        actions: [act('view', 'View', C.REPORTERS_MANAGE), act('edit', 'Edit', C.REPORTERS_MANAGE)] },
        ],
      },
      {
        id: 'requests',
        label: 'Requests',
        pages: [
          { id: 'pending',  label: 'Pending',  actions: [act('view', 'View', C.REPORTERS_MANAGE), act('approve', 'Approve', C.REPORTERS_MANAGE), act('delete', 'Reject', C.REPORTERS_MANAGE)] },
          { id: 'reviewed', label: 'Reviewed', actions: [act('view', 'View', C.REPORTERS_MANAGE)] },
        ],
      },
      {
        id: 'earnings',
        label: 'Earnings',
        pages: [
          { id: 'summary',     label: 'Summary',     actions: [act('view', 'View', C.REPORTERS_MANAGE), act('export', 'Export', C.REPORTERS_MANAGE)] },
          { id: 'adjustments', label: 'Adjustments', actions: [act('view', 'View', C.REPORTERS_MANAGE), act('edit', 'Adjust', C.REPORTERS_MANAGE)] },
        ],
      },
      {
        id: 'commission',
        label: 'Commission Rules',
        pages: [
          { id: 'rules', label: 'Rules', actions: [act('view', 'View', C.REPORTERS_MANAGE), act('create', 'Create', C.REPORTERS_MANAGE), act('edit', 'Edit', C.REPORTERS_MANAGE), act('delete', 'Delete', C.REPORTERS_MANAGE)] },
        ],
      },
    ],
  },
  {
    id: 'users',
    label: 'App Users',
    submodules: [
      {
        id: 'directory',
        label: 'Directory',
        pages: [
          { id: 'users',      label: 'All Users',  actions: [act('view', 'View', C.USERS_VIEW), act('edit', 'Edit', C.USERS_MANAGE), act('suspend', 'Suspend', C.USERS_MANAGE)] },
          { id: 'moderation', label: 'Moderation', actions: [act('view', 'View', C.USERS_VIEW), act('suspend', 'Suspend', C.USERS_MANAGE), act('manage', 'Manage', C.USERS_MANAGE)] },
        ],
      },
      {
        id: 'monetization',
        label: 'Monetization',
        pages: [
          { id: 'subscriptions', label: 'Subscriptions', actions: [act('view', 'View', C.USERS_VIEW), act('manage', 'Manage', C.USERS_MANAGE)] },
        ],
      },
    ],
  },
  {
    id: 'ads',
    label: 'Ads',
    submodules: [
      {
        id: 'inventory',
        label: 'Inventory',
        pages: [
          { id: 'campaigns', label: 'Campaigns', actions: [act('view', 'View', C.ADS_MANAGE), act('create', 'Create', C.ADS_MANAGE), act('edit', 'Edit', C.ADS_MANAGE), act('delete', 'Delete', C.ADS_MANAGE)] },
          { id: 'slots',     label: 'Ad Slots',  actions: [act('view', 'View', C.ADS_MANAGE), act('create', 'Create', C.ADS_MANAGE), act('edit', 'Edit', C.ADS_MANAGE), act('delete', 'Delete', C.ADS_MANAGE)] },
          { id: 'creatives', label: 'Creatives', actions: [act('view', 'View', C.ADS_MANAGE), act('create', 'Create', C.ADS_MANAGE), act('edit', 'Edit', C.ADS_MANAGE), act('delete', 'Delete', C.ADS_MANAGE)] },
        ],
      },
      {
        id: 'insights',
        label: 'Insights',
        pages: [
          { id: 'performance', label: 'Performance', actions: [act('view', 'View', C.ADS_MANAGE), act('export', 'Export', C.ADS_MANAGE)] },
        ],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    submodules: [
      {
        id: 'accounts',
        label: 'Accounts',
        pages: [
          { id: 'earnings',     label: 'Earnings',     actions: [act('view', 'View', C.FINANCE_VIEW), act('export', 'Export', C.FINANCE_VIEW)] },
          { id: 'transactions', label: 'Transactions', actions: [act('view', 'View', C.FINANCE_VIEW), act('export', 'Export', C.FINANCE_VIEW)] },
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        pages: [
          { id: 'payouts',  label: 'Payouts',  actions: [act('view', 'View', C.FINANCE_VIEW), act('process', 'Process', C.FINANCE_VIEW)] },
          { id: 'invoices', label: 'Invoices', actions: [act('view', 'View', C.FINANCE_VIEW), act('create', 'Create', C.FINANCE_VIEW), act('export', 'Export', C.FINANCE_VIEW)] },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    submodules: [
      {
        id: 'messaging',
        label: 'Messaging',
        pages: [
          { id: 'push',  label: 'Push Notifications', actions: [act('view', 'View', C.NOTIFICATIONS_MANAGE), act('create', 'Create', C.NOTIFICATIONS_MANAGE), act('send', 'Send', C.NOTIFICATIONS_MANAGE), act('schedule', 'Schedule', C.NOTIFICATIONS_MANAGE), act('delete', 'Delete', C.NOTIFICATIONS_MANAGE)] },
          { id: 'inapp', label: 'In-App Messages',   actions: [act('view', 'View', C.NOTIFICATIONS_MANAGE), act('create', 'Create', C.NOTIFICATIONS_MANAGE), act('send', 'Send', C.NOTIFICATIONS_MANAGE), act('delete', 'Delete', C.NOTIFICATIONS_MANAGE)] },
        ],
      },
      {
        id: 'config',
        label: 'Configuration',
        pages: [
          { id: 'templates', label: 'Templates', actions: [act('view', 'View', C.NOTIFICATIONS_MANAGE), act('create', 'Create', C.NOTIFICATIONS_MANAGE), act('edit', 'Edit', C.NOTIFICATIONS_MANAGE), act('delete', 'Delete', C.NOTIFICATIONS_MANAGE)] },
          { id: 'history',   label: 'History',   actions: [act('view', 'View', C.NOTIFICATIONS_MANAGE), act('export', 'Export', C.NOTIFICATIONS_MANAGE)] },
        ],
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    submodules: [
      {
        id: 'reports',
        label: 'Reports',
        pages: [
          { id: 'content',  label: 'Content',   actions: [act('view', 'View', C.ANALYTICS_VIEW), act('export', 'Export', C.ANALYTICS_VIEW)] },
          { id: 'reporter', label: 'Reporters', actions: [act('view', 'View', C.ANALYTICS_VIEW), act('export', 'Export', C.ANALYTICS_VIEW)] },
          { id: 'video',    label: 'Video',     actions: [act('view', 'View', C.ANALYTICS_VIEW), act('export', 'Export', C.ANALYTICS_VIEW)] },
          { id: 'ads',      label: 'Ads',       actions: [act('view', 'View', C.ANALYTICS_VIEW), act('export', 'Export', C.ANALYTICS_VIEW)] },
        ],
      },
      {
        id: 'audience',
        label: 'Audience',
        pages: [
          { id: 'overview', label: 'Overview', actions: [act('view', 'View', C.ANALYTICS_VIEW), act('export', 'Export', C.ANALYTICS_VIEW)] },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    submodules: [
      {
        id: 'access',
        label: 'Access',
        pages: [
          { id: 'usersroles', label: 'Users & Roles', actions: [act('view', 'View', C.USERS_MANAGE), act('manage', 'Manage', C.USERS_MANAGE)] },
        ],
      },
      {
        id: 'config',
        label: 'Configuration',
        pages: [
          { id: 'masterdata', label: 'Master Data', actions: [act('view', 'View', C.ORG_CONFIGURE), act('manage', 'Manage', C.ORG_CONFIGURE)] },
          { id: 'auditlog',   label: 'Audit Log',   actions: [act('view', 'View', C.ORG_CONFIGURE), act('export', 'Export', C.ORG_CONFIGURE)] },
        ],
      },
      {
        id: 'platform',
        label: 'Platform',
        pages: [
          { id: 'platform', label: 'Platform', actions: [act('view', 'View', C.PLATFORM_MANAGE), act('manage', 'Manage', C.PLATFORM_MANAGE)] },
        ],
      },
    ],
  },
]

// Expand raw authoring form → full catalog with resolved capability strings and
// per-module union of action columns.
export const PERMISSION_CATALOG: CapabilityModule[] = RAW_CATALOG.map(mod => {
  const submodules: CapabilitySubmodule[] = mod.submodules.map(sub => ({
    id: sub.id,
    label: sub.label,
    pages: sub.pages.map(pg => ({
      id: pg.id,
      label: pg.label,
      actions: pg.actions.map(a => ({
        key: a.key,
        label: a.label,
        permission: a.permission,
        capability: `${mod.id}.${pg.id}:${a.key}`,
      })),
    })),
  }))
  // Column set = distinct action keys across the whole module, first-seen order.
  const columns: CapabilityAction[] = []
  for (const sub of submodules) {
    for (const pg of sub.pages) {
      for (const a of pg.actions) {
        if (!columns.some(c => c.key === a.key)) columns.push(a)
      }
    }
  }
  return { id: mod.id, label: mod.label, actions: columns, submodules }
})

// ── Derived indexes ───────────────────────────────────────────────────────────

export type Capability = string

const _allCaps: Capability[] = []
const _capToPerm: Record<string, Permission> = {}
const _capLabel: Record<string, string> = {}

for (const mod of PERMISSION_CATALOG) {
  for (const sub of mod.submodules) {
    for (const pg of sub.pages) {
      for (const a of pg.actions) {
        _allCaps.push(a.capability)
        _capToPerm[a.capability] = a.permission
        _capLabel[a.capability] = `${mod.label} · ${sub.label} · ${pg.label} — ${a.label}`
      }
    }
  }
}

export const ALL_CAPABILITIES: readonly Capability[] = _allCaps
export const CAPABILITY_TO_PERMISSION: Readonly<Record<string, Permission>> = _capToPerm

const COARSE_VALUES = new Set<string>(Object.values(Permission))

export function isCoarsePermission(x: string): x is Permission {
  return COARSE_VALUES.has(x)
}

// All granular capabilities that belong to a coarse permission group.
export function capabilitiesForPermission(permission: Permission): Capability[] {
  return _allCaps.filter(c => _capToPerm[c] === permission)
}

// Expand a set of coarse permissions into every granular capability they cover.
// Used to seed default (system) roles from the human-readable ROLE_PERMISSIONS.
export function expandPermissions(coarse: readonly Permission[]): Capability[] {
  const groups = new Set<string>(coarse)
  return _allCaps.filter(c => groups.has(_capToPerm[c]!))
}

// Human-readable label for a capability (used in access previews).
export function capabilityLabel(cap: Capability): string {
  return _capLabel[cap] ?? cap
}

// The granular capabilities exposed by a specific catalog page (for nav gating).
export function pageCapabilities(moduleId: string, pageId: string): Capability[] {
  const mod = PERMISSION_CATALOG.find(m => m.id === moduleId)
  for (const sub of mod?.submodules ?? []) {
    const pg = sub.pages.find(p => p.id === pageId)
    if (pg) return pg.actions.map(a => a.capability)
  }
  return []
}

// All granular capabilities under a sub-module (for nav sub-tab gating & section toggles).
export function submoduleCapabilities(moduleId: string, submoduleId: string): Capability[] {
  const mod = PERMISSION_CATALOG.find(m => m.id === moduleId)
  const sub = mod?.submodules.find(s => s.id === submoduleId)
  return sub ? sub.pages.flatMap(p => p.actions.map(a => a.capability)) : []
}

// ── Default (built-in) role → coarse permission sets ──────────────────────────
// Human-readable intent per system role; also used for test assertions. The
// runtime store below expands these into granular capabilities.

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  [Role.SUPER_ADMIN]:       Object.values(Permission),
  [Role.ORG_ADMIN]:         [Permission.CONTENT_CREATE, Permission.CONTENT_EDIT, Permission.CONTENT_REVIEW, Permission.CONTENT_PUBLISH, Permission.REPORTERS_MANAGE, Permission.ADS_MANAGE, Permission.USERS_VIEW, Permission.USERS_MANAGE, Permission.FINANCE_VIEW, Permission.ANALYTICS_VIEW, Permission.ORG_CONFIGURE, Permission.NOTIFICATIONS_MANAGE],
  [Role.EDITOR]:            [Permission.CONTENT_CREATE, Permission.CONTENT_EDIT, Permission.CONTENT_REVIEW, Permission.CONTENT_PUBLISH, Permission.ANALYTICS_VIEW, Permission.NOTIFICATIONS_MANAGE],
  [Role.MARKETING_MANAGER]: [Permission.CONTENT_CREATE, Permission.CONTENT_EDIT, Permission.ADS_MANAGE, Permission.ANALYTICS_VIEW, Permission.NOTIFICATIONS_MANAGE],
  [Role.CONTENT_REVIEWER]:  [Permission.CONTENT_REVIEW, Permission.ANALYTICS_VIEW],
  [Role.REPORTER_MANAGER]:  [Permission.REPORTERS_MANAGE, Permission.ANALYTICS_VIEW],
  [Role.AD_MANAGER]:        [Permission.ADS_MANAGE, Permission.ANALYTICS_VIEW],
  [Role.FINANCE_MANAGER]:   [Permission.FINANCE_VIEW, Permission.ANALYTICS_VIEW],
  [Role.SUPPORT_EXECUTIVE]: [Permission.USERS_VIEW, Permission.ANALYTICS_VIEW],
  [Role.ANALYTICS_VIEWER]:  [Permission.ANALYTICS_VIEW],
  [Role.REPORTER]:          [Permission.CONTENT_EDIT],
}

// ── Runtime-mutable store (granular) ──────────────────────────────────────────
// Starts from defaults expanded to granular capabilities; role CRUD mutates this
// so can() stays synchronous.

const _store = new Map<string, Set<Capability>>(
  Object.entries(ROLE_PERMISSIONS).map(
    ([id, perms]) => [id, new Set(expandPermissions(perms))],
  ),
)

// Returns the granular capabilities held by a role.
export function getRolePermissions(roleId: string): Capability[] {
  return Array.from(_store.get(roleId) ?? [])
}

export function setRolePermissions(roleId: string, caps: Capability[]): void {
  _store.set(roleId, new Set(caps))
}

export function deleteRolePermissions(roleId: string): void {
  _store.delete(roleId)
}

export function listRoleIds(): string[] {
  return Array.from(_store.keys())
}

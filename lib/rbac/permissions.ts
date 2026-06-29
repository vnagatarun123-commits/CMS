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

// Default (built-in) permission sets — also used for test assertions
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

// ── Runtime-mutable store ─────────────────────────────────────────────────────
// Starts from defaults; role CRUD actions mutate this so can() stays sync.

const _store = new Map<string, Set<Permission>>(
  Object.entries(ROLE_PERMISSIONS).map(([id, perms]) => [id, new Set(perms)])
)

export function getRolePermissions(roleId: string): Permission[] {
  return Array.from(_store.get(roleId) ?? [])
}

export function setRolePermissions(roleId: string, perms: Permission[]): void {
  _store.set(roleId, new Set(perms))
}

export function deleteRolePermissions(roleId: string): void {
  _store.delete(roleId)
}

export function listRoleIds(): string[] {
  return Array.from(_store.keys())
}

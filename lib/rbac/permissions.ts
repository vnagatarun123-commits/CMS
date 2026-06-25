export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  EDITOR: 'EDITOR',
  CONTENT_REVIEWER: 'CONTENT_REVIEWER',
  REPORTER_MANAGER: 'REPORTER_MANAGER',
  AD_MANAGER: 'AD_MANAGER',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  SUPPORT_EXECUTIVE: 'SUPPORT_EXECUTIVE',
  ANALYTICS_VIEWER: 'ANALYTICS_VIEWER',
  REPORTER: 'REPORTER',
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const Permission = {
  CONTENT_EDIT: 'content:edit',
  CONTENT_REVIEW: 'content:review',
  CONTENT_PUBLISH: 'content:publish',
  REPORTERS_MANAGE: 'reporters:manage',
  ADS_MANAGE: 'ads:manage',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  FINANCE_VIEW: 'finance:view',
  ANALYTICS_VIEW: 'analytics:view',
  ORG_CONFIGURE: 'org:configure',
  PLATFORM_MANAGE: 'platform:manage',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ORG_ADMIN]: [
    Permission.CONTENT_EDIT,
    Permission.CONTENT_REVIEW,
    Permission.CONTENT_PUBLISH,
    Permission.REPORTERS_MANAGE,
    Permission.ADS_MANAGE,
    Permission.USERS_VIEW,
    Permission.USERS_MANAGE,
    Permission.FINANCE_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ORG_CONFIGURE,
  ],
  [Role.EDITOR]: [
    Permission.CONTENT_EDIT,
    Permission.CONTENT_REVIEW,
    Permission.CONTENT_PUBLISH,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.CONTENT_REVIEWER]: [
    Permission.CONTENT_REVIEW,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.REPORTER_MANAGER]: [
    Permission.REPORTERS_MANAGE,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.AD_MANAGER]: [
    Permission.ADS_MANAGE,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.MARKETING_MANAGER]: [
    Permission.CONTENT_EDIT,
    Permission.ADS_MANAGE,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.FINANCE_MANAGER]: [
    Permission.FINANCE_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.SUPPORT_EXECUTIVE]: [
    Permission.USERS_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
  [Role.ANALYTICS_VIEWER]: [
    Permission.ANALYTICS_VIEW,
  ],
  [Role.REPORTER]: [
    Permission.CONTENT_EDIT,
  ],
}

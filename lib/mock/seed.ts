import type { Organization, UserWithRole } from '@/types/domain'
import { Role } from '@/lib/rbac/permissions'

export const PURALOCAL_ORG_ID = 'org_puralocal_001'

export const SEEDED_ORG: Organization = {
  id: PURALOCAL_ORG_ID,
  name: 'PuraLocal',
  slug: 'puralocal',
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

const joined = new Date('2024-01-15T00:00:00Z')

export const SEEDED_USERS: UserWithRole[] = [
  {
    id: 'user_super_admin',
    email: 'superadmin@platform.local',
    name: 'Platform Super Admin',
    role: Role.SUPER_ADMIN,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_org_admin',
    email: 'admin@puralocal.com',
    name: 'Org Admin',
    role: Role.ORG_ADMIN,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_editor',
    email: 'editor@puralocal.com',
    name: 'Editor',
    role: Role.EDITOR,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_content_reviewer',
    email: 'reviewer@puralocal.com',
    name: 'Content Reviewer',
    role: Role.CONTENT_REVIEWER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_reporter_manager',
    email: 'reportermgr@puralocal.com',
    name: 'Reporter Manager',
    role: Role.REPORTER_MANAGER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_ad_manager',
    email: 'ads@puralocal.com',
    name: 'Ad Manager',
    role: Role.AD_MANAGER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_marketing_manager',
    email: 'marketing@puralocal.com',
    name: 'Marketing Manager',
    role: Role.MARKETING_MANAGER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_finance_manager',
    email: 'finance@puralocal.com',
    name: 'Finance Manager',
    role: Role.FINANCE_MANAGER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_support_executive',
    email: 'support@puralocal.com',
    name: 'Support Executive',
    role: Role.SUPPORT_EXECUTIVE,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_analytics_viewer',
    email: 'analytics@puralocal.com',
    name: 'Analytics Viewer',
    role: Role.ANALYTICS_VIEWER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
  {
    id: 'user_reporter',
    email: 'reporter@puralocal.com',
    name: 'Reporter',
    role: Role.REPORTER,
    organizationId: PURALOCAL_ORG_ID,
    invitedAt: joined,
    joinedAt: joined,
  },
]

// Convenience lookup used by mock auth sign-in (all passwords are "password" in dev).
export const MOCK_USER_PASSWORDS: Record<string, string> = Object.fromEntries(
  SEEDED_USERS.map(u => [u.email, 'password']),
)

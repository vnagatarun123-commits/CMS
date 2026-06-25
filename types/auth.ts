import type { Role } from '@/lib/rbac/permissions'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  organizationId: string
}

export interface Session {
  user: User
  orgContext: OrgContext
}

export interface OrgContext {
  organizationId: string
  organizationName: string
}

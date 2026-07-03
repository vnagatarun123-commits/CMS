export interface User {
  id: string
  email: string
  name: string
  role: string   // role ID — built-in or custom
  organizationId: string
  photoUrl?: string | null
}

export interface Session {
  user: User
  orgContext: OrgContext
}

export interface OrgContext {
  organizationId: string
  organizationName: string
}

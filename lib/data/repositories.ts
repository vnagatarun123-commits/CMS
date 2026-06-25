import type { Organization, UserWithRole, RoleAssignment, AuditEntry, AuditAction } from '@/types/domain'
import type { Role } from '@/lib/rbac/permissions'

// Every repository method requires an explicit organizationId.
// Implementations must throw MissingOrgContextError if it is absent,
// and WrongOrgError if a resolved record belongs to a different org.

export interface OrganizationRepository {
  findById(organizationId: string): Promise<Organization | null>
}

export interface UserRepository {
  listByOrg(organizationId: string): Promise<UserWithRole[]>
  findById(userId: string, organizationId: string): Promise<UserWithRole | null>
  findByEmail(email: string, organizationId: string): Promise<UserWithRole | null>
  invite(params: InviteUserParams): Promise<UserWithRole>
  remove(userId: string, organizationId: string): Promise<void>
}

export interface RoleAssignmentRepository {
  assign(params: AssignRoleParams): Promise<RoleAssignment>
  remove(userId: string, organizationId: string): Promise<void>
  findByUser(userId: string, organizationId: string): Promise<RoleAssignment | null>
}

export interface AuditLogRepository {
  list(organizationId: string, opts?: AuditListOptions): Promise<AuditEntry[]>
  append(entry: AppendAuditParams): Promise<AuditEntry>
}

// ── Parameter shapes ────────────────────────────────────────────────────────

export interface InviteUserParams {
  email: string
  name: string
  role: Role
  organizationId: string
  invitedById: string
}

export interface AssignRoleParams {
  userId: string
  role: Role
  organizationId: string
  assignedById: string
}

export interface AppendAuditParams {
  organizationId: string
  actorId: string
  actorName: string
  action: AuditAction
  targetType: 'user' | 'organization'
  targetId: string
  targetLabel: string
  metadata?: Record<string, unknown>
}

export interface AuditListOptions {
  limit?: number
  before?: Date
}

// ── Aggregate backend shape ──────────────────────────────────────────────────

export interface DataBackend {
  organizations: OrganizationRepository
  users: UserRepository
  roleAssignments: RoleAssignmentRepository
  auditLog: AuditLogRepository
}

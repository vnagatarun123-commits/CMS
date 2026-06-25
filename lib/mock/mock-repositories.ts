import type {
  OrganizationRepository,
  UserRepository,
  RoleAssignmentRepository,
  AuditLogRepository,
  InviteUserParams,
  AssignRoleParams,
  AppendAuditParams,
  AuditListOptions,
} from '@/lib/data/repositories'
import type { Organization, UserWithRole, RoleAssignment, AuditEntry } from '@/types/domain'
import { MissingOrgContextError, WrongOrgError, NotFoundError } from '@/lib/errors'

// ── Guard ─────────────────────────────────────────────────────────────────────

function assertOrg(organizationId: string): void {
  // Runtime check — callers receive `string` from TypeScript, but server actions
  // can pass an empty/undefined value if org context was never set.
  if (!organizationId) throw new MissingOrgContextError()
}

// ── OrganizationRepository ────────────────────────────────────────────────────

export class MockOrganizationRepository implements OrganizationRepository {
  private orgs: Map<string, Organization>

  constructor(orgs: Organization[]) {
    this.orgs = new Map(orgs.map(o => [o.id, o]))
  }

  async findById(organizationId: string): Promise<Organization | null> {
    assertOrg(organizationId)
    return this.orgs.get(organizationId) ?? null
  }
}

// ── UserRepository ────────────────────────────────────────────────────────────

export class MockUserRepository implements UserRepository {
  private users: Map<string, UserWithRole>
  private nextSeq = 1

  constructor(users: UserWithRole[]) {
    this.users = new Map(users.map(u => [u.id, u]))
  }

  async listByOrg(organizationId: string): Promise<UserWithRole[]> {
    assertOrg(organizationId)
    return [...this.users.values()].filter(u => u.organizationId === organizationId)
  }

  async findById(userId: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const user = this.users.get(userId)
    if (!user) return null
    if (user.organizationId !== organizationId) return null
    return user
  }

  async findByEmail(email: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const user = [...this.users.values()].find(u => u.email === email)
    if (!user) return null
    if (user.organizationId !== organizationId) return null
    return user
  }

  async invite(params: InviteUserParams): Promise<UserWithRole> {
    assertOrg(params.organizationId)
    const user: UserWithRole = {
      id: `user_invited_${this.nextSeq++}`,
      email: params.email,
      name: params.name,
      role: params.role,
      organizationId: params.organizationId,
      invitedAt: new Date(),
      joinedAt: null,
    }
    this.users.set(user.id, user)
    return user
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const user = this.users.get(userId)
    if (!user) throw new NotFoundError('User')
    if (user.organizationId !== organizationId) throw new WrongOrgError()
    this.users.delete(userId)
  }
}

// ── RoleAssignmentRepository ──────────────────────────────────────────────────

export class MockRoleAssignmentRepository implements RoleAssignmentRepository {
  private assignments: Map<string, RoleAssignment>

  constructor(assignments: RoleAssignment[]) {
    this.assignments = new Map(assignments.map(a => [a.userId, a]))
  }

  async assign(params: AssignRoleParams): Promise<RoleAssignment> {
    assertOrg(params.organizationId)
    const assignment: RoleAssignment = {
      userId: params.userId,
      role: params.role,
      organizationId: params.organizationId,
      assignedAt: new Date(),
      assignedBy: params.assignedById,
    }
    this.assignments.set(params.userId, assignment)
    return assignment
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const a = this.assignments.get(userId)
    if (!a) throw new NotFoundError('RoleAssignment')
    if (a.organizationId !== organizationId) throw new WrongOrgError()
    this.assignments.delete(userId)
  }

  async findByUser(userId: string, organizationId: string): Promise<RoleAssignment | null> {
    assertOrg(organizationId)
    const a = this.assignments.get(userId)
    if (!a || a.organizationId !== organizationId) return null
    return a
  }
}

// ── AuditLogRepository ────────────────────────────────────────────────────────

export class MockAuditLogRepository implements AuditLogRepository {
  private entries: AuditEntry[]
  private nextSeq = 1

  constructor(entries: AuditEntry[]) {
    this.entries = [...entries]
  }

  async list(organizationId: string, opts?: AuditListOptions): Promise<AuditEntry[]> {
    assertOrg(organizationId)
    let results = this.entries.filter(e => e.organizationId === organizationId)
    if (opts?.before) {
      results = results.filter(e => e.createdAt < opts.before!)
    }
    results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (opts?.limit) results = results.slice(0, opts.limit)
    return results
  }

  async append(params: AppendAuditParams): Promise<AuditEntry> {
    assertOrg(params.organizationId)
    const entry: AuditEntry = {
      id: `audit_${this.nextSeq++}`,
      organizationId: params.organizationId,
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
    }
    this.entries.push(entry)
    return entry
  }
}

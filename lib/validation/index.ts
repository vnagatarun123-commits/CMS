import { z } from 'zod'
import { Role } from '@/lib/rbac/permissions'

const roleValues = Object.values(Role) as [Role, ...Role[]]

export const SignInInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type SignInInput = z.infer<typeof SignInInput>

export const InviteUserInput = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(roleValues, { error: 'Invalid role' }),
})
export type InviteUserInput = z.infer<typeof InviteUserInput>

export const AssignRoleInput = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(roleValues, { error: 'Invalid role' }),
})
export type AssignRoleInput = z.infer<typeof AssignRoleInput>

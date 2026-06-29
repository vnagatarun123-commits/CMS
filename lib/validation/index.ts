import { z } from 'zod'
import { Permission } from '@/lib/rbac/permissions'

export const SignInInput = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type SignInInput = z.infer<typeof SignInInput>

export const InviteUserInput = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
})
export type InviteUserInput = z.infer<typeof InviteUserInput>

export const AssignRoleInput = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.string().min(1, 'Role is required'),
})
export type AssignRoleInput = z.infer<typeof AssignRoleInput>

const permissionValues = Object.values(Permission) as [Permission, ...Permission[]]

export const CreateRoleInput = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  permissions: z.array(z.enum(permissionValues)),
})
export type CreateRoleInput = z.infer<typeof CreateRoleInput>

export const UpdateRoleInput = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  permissions: z.array(z.enum(permissionValues)),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleInput>

import { z } from 'zod'
import { ALL_CAPABILITIES } from '@/lib/rbac/permissions'

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

const capabilityValues = [...ALL_CAPABILITIES] as [string, ...string[]]

export const CreateRoleInput = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  permissions: z.array(z.enum(capabilityValues)),
})
export type CreateRoleInput = z.infer<typeof CreateRoleInput>

export const UpdateRoleInput = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  permissions: z.array(z.enum(capabilityValues)),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleInput>

export const UpdateProfileInput = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  timezone: z.string().max(60).nullable().optional(),
  language: z.string().max(10).nullable().optional(),
  photoUrl: z.string().max(2_000_000).nullable().optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>

export const ForgotPasswordInput = z.object({
  email: z.string().email('Invalid email address'),
})
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>

export const ResetPasswordInput = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>

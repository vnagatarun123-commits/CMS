import { SEEDED_USERS } from '@/lib/mock/seed'
import { LoginForm } from './_components/login-form'

// Server component: resolves env and seeds dev data server-side.
// seedEmails is NEVER populated in production — the conditional is evaluated
// at request time on the server, so no mock data ever reaches the client bundle.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const seedEmails =
    process.env.NODE_ENV === 'development'
      ? SEEDED_USERS.map(u => ({ email: u.email, name: u.name, role: u.role }))
      : undefined

  return (
    <LoginForm
      seedEmails={seedEmails}
      linkError={params.error === 'invalid_link' ? 'The reset link is invalid or has expired. Please request a new one.' : undefined}
    />
  )
}

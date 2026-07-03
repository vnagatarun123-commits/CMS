import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getBackend } from '@/lib/backend'
import { SecurityClient } from './_components/security-client'

export const metadata = { title: 'Security — PuraLocal CMS' }

export default async function SecurityPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await getBackend().data.users.findById(
    session.user.id,
    session.orgContext.organizationId,
  )

  if (!profile) redirect('/login')

  return <SecurityClient user={session.user} profile={profile} />
}

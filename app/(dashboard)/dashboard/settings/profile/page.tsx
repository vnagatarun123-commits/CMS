import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getBackend } from '@/lib/backend'
import { ProfileClient } from './_components/profile-client'

export const metadata = { title: 'My Profile — PuraLocal CMS' }

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const profile = await getBackend().data.users.findById(
    session.user.id,
    session.orgContext.organizationId,
  )

  if (!profile) redirect('/login')

  return <ProfileClient profile={profile} currentUser={session.user} />
}

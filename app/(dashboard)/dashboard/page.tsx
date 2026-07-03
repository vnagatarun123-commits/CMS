import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDashboardStats } from '@/app/actions/dashboard'
import { DashboardClient } from './_components/dashboard-client'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await getDashboardStats()
  const stats = result.ok ? result.data : null

  return <DashboardClient user={session.user} stats={stats} />
}

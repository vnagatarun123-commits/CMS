import { getSession } from '@/lib/auth/session'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const session = await getSession()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to PuraLocal CMS</p>
      </div>
      <div className="w-fit rounded-lg border bg-white p-6 shadow-sm space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-400">Signed in as</p>
        <p className="font-medium">{session?.user.name}</p>
        <p className="text-sm text-gray-500">{session?.user.email}</p>
        <Badge variant="secondary">{session?.user.role}</Badge>
      </div>
    </div>
  )
}

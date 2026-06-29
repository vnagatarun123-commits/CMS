import { listUsers } from '@/app/actions/users'
import { listRoles } from '@/app/actions/roles'
import { UsersRolesClient } from './_components/users-roles-client'

export default async function UsersRolesPage() {
  const [usersResult, rolesResult] = await Promise.all([listUsers(), listRoles()])
  const users = usersResult.ok ? usersResult.data : []
  const roles = rolesResult.ok ? rolesResult.data : []

  return (
    <>
      {process.env.NODE_ENV === 'development' && (!rolesResult.ok || !usersResult.ok) && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-1">
          <p className="font-semibold">Dev: data fetch failed</p>
          {!rolesResult.ok && <p>roles: {rolesResult.error.code} — {rolesResult.error.message}</p>}
          {!usersResult.ok && <p>users: {usersResult.error.code} — {usersResult.error.message}</p>}
          <p className="text-xs text-muted-foreground">Sign out and sign back in if you see UNAUTHENTICATED.</p>
        </div>
      )}
      <UsersRolesClient initialUsers={users} initialRoles={roles} />
    </>
  )
}

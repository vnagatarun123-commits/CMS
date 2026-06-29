import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { signOut } from '@/app/actions/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  async function handleSignOut() {
    'use server'
    await signOut()
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-full overflow-hidden">
        <Sidebar user={session.user} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar user={session.user} signOutAction={handleSignOut} />
          <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
        </div>
        <Toaster richColors position="bottom-right" />
      </div>
    </SidebarProvider>
  )
}

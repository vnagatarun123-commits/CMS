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
      {/* Gray canvas — the white content panel floats on top of it (Vesper shell) */}
      <div className="flex h-full overflow-hidden bg-[oklch(0.960_0.004_264)] dark:bg-[oklch(0.098_0.011_264)]">
        <Sidebar user={session.user} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar user={session.user} signOutAction={handleSignOut} />
          {/* Floating white panel with a gray gutter around it */}
          <main className="flex-1 overflow-hidden pr-3 pb-3 pl-3">
            <div className="h-full overflow-y-auto rounded-2xl bg-card ring-1 ring-border/60 shadow-[0_1px_3px_oklch(0_0_0/0.04),0_8px_24px_oklch(0_0_0/0.04)] p-6 sm:p-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster richColors position="bottom-right" />
      </div>
    </SidebarProvider>
  )
}

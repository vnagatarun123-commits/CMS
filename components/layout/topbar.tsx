'use client'

import { useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, User2, ChevronDown, Bell, Search, ChevronRight } from 'lucide-react'
import type { User } from '@/types/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_ITEMS } from './nav-items'

interface TopbarProps {
  user: User
  signOutAction: () => Promise<void>
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface BreadcrumbSegment {
  label: string
  href?: string
}

function useBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + '/')) {
          return [
            { label: item.label, href: item.children[0]?.href },
            { label: child.label },
          ]
        }
      }
      // parent path but no matching child
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return [{ label: item.label }]
      }
    } else {
      const match = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href)
      if (match) return [{ label: item.label }]
    }
  }
  return [{ label: 'Dashboard' }]
}

export function Topbar({ user, signOutAction }: TopbarProps) {
  const [pending, startTransition] = useTransition()
  const pathname = usePathname()
  const breadcrumbs = useBreadcrumbs(pathname)

  function handleSignOut() {
    startTransition(() => { void signOutAction() })
  }

  // Stub notification count — will be replaced with real data in a later phase
  const unreadCount = 0

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-sm px-5 gap-4">

      {/* ── Left: breadcrumbs ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
              <span className={
                isLast
                  ? 'text-[13px] font-semibold text-foreground tracking-tight truncate'
                  : 'text-[13px] font-medium text-muted-foreground truncate'
              }>
                {crumb.label}
              </span>
            </span>
          )
        })}
      </nav>

      {/* ── Right: search + notification + user ───────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Search */}
        <button
          className="hidden md:flex items-center gap-2 h-8 rounded-md border border-border bg-background/50 px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {}}
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-1 hidden lg:inline-flex h-4 items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        {/* Search icon only on small screens */}
        <button className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>

        {/* Notification bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={pending}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start gap-0 leading-none min-w-0">
              <span className="text-[12px] font-semibold text-foreground leading-tight truncate max-w-[96px]">
                {user.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[96px] capitalize">
                {user.role.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="pb-2 pt-1.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-sm bg-primary/15 text-primary font-semibold">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-foreground truncate">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                    <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 h-4 border-border text-muted-foreground font-medium tracking-wide uppercase">
                      {user.role.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2.5 cursor-pointer py-2">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Profile</span>
                <span className="text-[11px] text-muted-foreground font-normal">View and edit your profile</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2.5 cursor-pointer py-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Settings</span>
                <span className="text-[11px] text-muted-foreground font-normal">Account preferences</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={pending}
              className="text-sm gap-2.5 text-destructive focus:text-destructive cursor-pointer py-2"
            >
              <LogOut className="h-4 w-4" />
              {pending ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

'use client'

import { useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, User2, ChevronDown, Bell } from 'lucide-react'
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

function usePageTitle(pathname: string): string {
  for (const item of NAV_ITEMS) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + '/')) return child.label
      }
      if (pathname.startsWith(item.href)) return item.label
    } else {
      const match = item.exactMatch ? pathname === item.href : pathname.startsWith(item.href)
      if (match) return item.label
    }
  }
  return 'Dashboard'
}

export function Topbar({ user, signOutAction }: TopbarProps) {
  const [pending, startTransition] = useTransition()
  const pathname = usePathname()
  const pageTitle = usePageTitle(pathname)

  function handleSignOut() {
    startTransition(() => {
      void signOutAction()
    })
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-sm px-5 gap-4">

      {/* ── Left: page title ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-[13px] font-semibold text-foreground tracking-tight truncate">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: actions + user ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Notification bell */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bell className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={pending}
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-[13px] font-medium text-foreground leading-none">
              {user.name.split(' ')[0]}
            </span>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[9px] px-1.5 py-0 h-4 border-border text-muted-foreground font-medium tracking-wide uppercase"
            >
              {user.role.replace(/_/g, ' ')}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="pb-1.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2 cursor-pointer">
              <User2 className="h-4 w-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2 cursor-pointer">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={pending}
              className="text-sm gap-2 text-destructive focus:text-destructive cursor-pointer"
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

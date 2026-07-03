'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User2, ChevronDown, Bell, Search } from 'lucide-react'
import type { User } from '@/types/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

interface TopbarProps {
  user: User
  signOutAction: () => Promise<void>
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function Topbar({ user, signOutAction }: TopbarProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSignOut() {
    startTransition(() => { void signOutAction() })
  }

  // Stub notification count — will be replaced with real data in a later phase
  const unreadCount = 0

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 bg-transparent px-4 pl-3">

      {/* ── Left: big search bar (Vesper style) ────────────────────────────── */}
      <button
        className="hidden md:flex items-center gap-3 h-11 w-full max-w-[560px] rounded-xl bg-card px-4 text-[14px] text-muted-foreground ring-1 ring-border/70 shadow-sm hover:ring-border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {}}
        aria-label="Search"
      >
        <Search className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden lg:inline-flex h-6 items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* spacer pushes the right cluster to the edge */}
      <div className="flex-1" />

      {/* ── Right: actions + user ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search icon — small screens */}
        <button className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-card ring-1 ring-border/70 shadow-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Search">
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Notification bell */}
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card ring-1 ring-border/70 shadow-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none ring-2 ring-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 h-7 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={pending}
          >
            <Avatar className="h-9 w-9">
              {user.photoUrl && <AvatarImage src={user.photoUrl} alt={user.name} />}
              <AvatarFallback className="text-[12px] bg-primary/15 text-primary font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start gap-0.5 leading-none min-w-0">
              <span className="text-[13.5px] font-semibold text-foreground leading-tight truncate max-w-[150px]">
                {user.name}
              </span>
              <span className="text-[11.5px] text-muted-foreground leading-tight truncate max-w-[150px]">
                {user.email}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
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
            <DropdownMenuItem
              className="text-sm gap-2.5 cursor-pointer py-2"
              onClick={() => router.push('/dashboard/settings/profile')}
            >
              <User2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Profile</span>
                <span className="text-[11px] text-muted-foreground font-normal">View and edit your profile</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-sm gap-2.5 cursor-pointer py-2"
              onClick={() => router.push('/dashboard/settings/security')}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>Security</span>
                <span className="text-[11px] text-muted-foreground font-normal">Password & account security</span>
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

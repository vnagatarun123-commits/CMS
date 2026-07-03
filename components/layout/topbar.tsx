'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User2, ChevronDown, Bell, Search, ChevronRight } from 'lucide-react'
import type { User } from '@/types/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
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

interface SystemNotification {
  id: string
  title: string
  body: string
  category: 'content' | 'live' | 'contributor' | 'ads'
  time: string
  unread: boolean
  link?: string
}

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n1',
    title: 'New Article Submitted',
    body: 'Anitha Rajan submitted "Farmers protest over crop insurance delays" for review.',
    category: 'content',
    time: '2 hours ago',
    unread: true,
    link: '/dashboard/content',
  },
  {
    id: 'n2',
    title: 'Live Stream Request',
    body: 'Ramesh Kumar requested approval for live stream "Breaking: Fire at Dilsukhnagar Market".',
    category: 'live',
    time: '4 hours ago',
    unread: true,
    link: '/dashboard/content/live',
  },
  {
    id: 'n3',
    title: 'New Contributor Application',
    body: 'Sanjay Kumar applied to be a Field Reporter in Warangal district.',
    category: 'contributor',
    time: '1 day ago',
    unread: false,
    link: '/dashboard/contributors',
  },
  {
    id: 'n4',
    title: 'Ad Campaign Completed',
    body: 'Campaign "Grand Wedding Mall Monsoon Sale" has reached its impression goal.',
    category: 'ads',
    time: '2 days ago',
    unread: false,
    link: '/dashboard/ads',
  },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function Topbar({ user, signOutAction }: TopbarProps) {
  const [pending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS)
  const router = useRouter()

  function handleSignOut() {
    startTransition(() => { void signOutAction() })
  }

  const unreadCount = notifications.filter(n => n.unread).length

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success('All notifications marked as read')
  }

  function handleNotificationClick(n: SystemNotification) {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))
    if (n.link) {
      router.push(n.link)
    }
  }

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

        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card ring-1 ring-border/70 shadow-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card animate-pulse" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <span className="font-semibold text-[13.5px]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] text-primary hover:underline font-medium cursor-pointer">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 p-3.5 hover:bg-muted/30 transition-colors cursor-pointer relative ${
                      n.unread ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {n.unread && (
                      <span className="absolute left-2.5 top-[18px] h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    <div className="flex-1 min-w-0 pl-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-[12.5px] leading-snug truncate ${n.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 tabular-nums">{n.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border p-2 bg-muted/10 text-center">
              <button
                onClick={() => { router.push('/dashboard/notifications') }}
                className="text-[11.5px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                View all notifications <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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

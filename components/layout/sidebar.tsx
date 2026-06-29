'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'
import { can } from '@/lib/rbac/can'
import { NAV_ITEMS } from './nav-items'

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    item => item.permission === null || can(user, item.permission),
  )

  function isActive(href: string, exact?: boolean): boolean {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  function isGroupOpen(href: string): boolean {
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-[0_0_16px_oklch(0.672_0.190_272.5/0.35)]">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M3 5h14M3 10h9M3 15h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary-foreground"/>
          </svg>
        </div>
        <div className="flex flex-col gap-0 leading-none">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">PuraLocal</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Content Studio
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const hasChildren = !!(item.children?.length)

          if (hasChildren) {
            const anyChildActive = item.children!.some(c => isActive(c.href))
            const isOpen = isGroupOpen(item.href)

            return (
              <div key={item.href}>
                <Link
                  href={item.children![0]!.href}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer',
                    anyChildActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-colors', anyChildActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground group-hover:text-foreground')} />
                  <span className="flex-1 truncate">{item.label}</span>
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground',
                      isOpen ? 'rotate-90' : 'rotate-0',
                    )}
                  />
                </Link>

                {isOpen && (
                  <div className="ml-3.5 mt-0.5 mb-1 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children!.map(child => {
                      const ChildIcon = child.icon
                      const childActive = isActive(child.href)
                      return (
                        <Link key={child.href} href={child.href}
                          className={cn(
                            'group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                            childActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
                          )}>
                          <ChildIcon className={cn('h-3.5 w-3.5 shrink-0', childActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground group-hover:text-foreground')} />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = isActive(item.href, item.exactMatch)
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
              )}>
              <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground group-hover:text-foreground')} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}

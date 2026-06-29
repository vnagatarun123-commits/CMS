'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'
import { can } from '@/lib/rbac/can'
import { NAV_SECTIONS } from './nav-items'
import { useSidebar } from './sidebar-context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function isGroupOpen(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <TooltipProvider delay={200}>
      <aside
        data-collapsed={collapsed}
        className={cn(
          'group/sidebar flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[52px]' : 'w-60',
        )}
      >
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-0' : 'gap-3 px-4',
        )}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-[0_0_16px_oklch(0.672_0.190_272.5/0.35)]">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M3 5h14M3 10h9M3 15h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary-foreground" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col gap-0 leading-none min-w-0">
              <span className="text-[13px] font-semibold text-foreground tracking-tight truncate">PuraLocal</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Content Studio
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-1">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(
              item => item.permission === null || can(user, item.permission),
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={si} className="px-2 space-y-0.5">
                {/* Section label — full width */}
                {section.label && !collapsed && (
                  <div className="px-3 pb-1 pt-0.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/60 select-none">
                      {section.label}
                    </span>
                  </div>
                )}
                {/* Section divider — collapsed mode */}
                {section.label && collapsed && (
                  <div className="flex justify-center py-1">
                    <div className="h-px w-5 bg-sidebar-border" />
                  </div>
                )}

                {visibleItems.map(item => {
                  const Icon = item.icon
                  const hasChildren = !!(item.children?.length)

                  // ── Group (has children) ────────────────────────────────
                  if (hasChildren) {
                    const anyChildActive = item.children!.some(c => isActive(c.href, c.exactMatch))
                    const isOpen = isGroupOpen(item.href)

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger
                            render={
                              <Link
                                href={item.children![0]!.href}
                                className={cn(
                                  'flex h-9 w-9 mx-auto items-center justify-center rounded-md transition-colors',
                                  anyChildActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-sidebar-foreground hover:bg-white/[0.06] hover:text-foreground',
                                )}
                              />
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return (
                      <div key={item.href}>
                        <Link
                          href={item.children![0]!.href}
                          className={cn(
                            'group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150',
                            isOpen
                              ? 'text-foreground bg-white/[0.04]'
                              : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', isOpen ? 'text-foreground' : 'text-sidebar-foreground group-hover:text-foreground')} />
                          <span className="flex-1 truncate">{item.label}</span>
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground',
                              isOpen ? 'rotate-90' : 'rotate-0',
                            )}
                          />
                        </Link>

                        {isOpen && (
                          <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-sidebar-border/60 pl-3">
                            {item.children!.map(child => {
                              const ChildIcon = child.icon
                              const childActive = isActive(child.href, child.exactMatch)
                              return (
                                <Link key={child.href} href={child.href}
                                  className={cn(
                                    'group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150',
                                    childActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
                                  )}>
                                  <ChildIcon className={cn('h-3.5 w-3.5 shrink-0', childActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-foreground')} />
                                  <span className="truncate">{child.label}</span>
                                  {childActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // ── Leaf item ───────────────────────────────────────────
                  const active = isActive(item.href, item.exactMatch)

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger
                          render={
                            <Link
                              href={item.href}
                              className={cn(
                                'flex h-9 w-9 mx-auto items-center justify-center rounded-md transition-colors relative',
                                active
                                  ? 'bg-primary/15 text-primary'
                                  : 'text-sidebar-foreground hover:bg-white/[0.06] hover:text-foreground',
                              )}
                            />
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {active && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground',
                      )}>
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary" />
                      )}
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-sidebar-foreground group-hover:text-foreground')} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* ── Collapse toggle ──────────────────────────────────────────────── */}
        <div className={cn(
          'border-t border-sidebar-border p-2 flex',
          collapsed ? 'justify-center' : 'justify-end',
        )}>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                />
              }
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />
              }
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

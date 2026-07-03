'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'
import { can } from '@/lib/rbac/can'
import { NAV_SECTIONS, type NavChild } from './nav-items'
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  // A sub-tab is visible if it declares no capabilities, or the user holds any of them.
  function childVisible(child: NavChild) {
    return !child.capabilities || child.capabilities.length === 0
      || child.capabilities.some(c => can(user, c))
  }

  useEffect(() => {
    NAV_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(c => isActive(c.href, c.exactMatch))
          if (hasActiveChild) {
            setExpandedGroups(prev => {
              if (prev[item.href]) return prev
              return { ...prev, [item.href]: true }
            })
          }
        }
      })
    })
  }, [pathname])

  function toggleGroup(href: string) {
    setExpandedGroups(prev => ({ ...prev, [href]: !prev[href] }))
  }

  return (
    <TooltipProvider delay={200}>
      <aside
        data-collapsed={collapsed}
        className={cn(
          'group/sidebar flex shrink-0 flex-col bg-transparent transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[64px]' : 'w-[252px]',
        )}
      >
        {/* ── Logo & Collapse Toggle ────────────────────────────────────────── */}
        <div className={cn(
          'flex h-16 shrink-0 items-center',
          collapsed ? 'justify-center px-1' : 'justify-between px-4',
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
                  <path d="M3 5h14M3 10h9M3 15h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-primary-foreground" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 leading-none min-w-0">
                <span className="text-[15px] font-semibold text-foreground tracking-tight truncate">PuraLocal</span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">
                  Content Studio
                </span>
              </div>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={toggle}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground transition-colors focus-visible:outline-none cursor-pointer"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                />
              }
            >
              {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4 w-4" />}
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-none">
          {NAV_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(item => {
              // Grouped items derive visibility from their sub-tabs.
              if (item.children?.length) return item.children.some(childVisible)
              return item.permission === null || can(user, item.permission)
            })
            if (visibleItems.length === 0) return null

            return (
              <div key={si} className={cn('px-2.5', si > 0 && 'mt-3')}>

                {/* Section label — expanded */}
                {section.label && !collapsed && (
                  <div className="px-3 pb-0.5 pt-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/45 select-none">
                      {section.label}
                    </span>
                  </div>
                )}

                {/* Section divider — collapsed */}
                {section.label && collapsed && si > 0 && (
                  <div className="flex justify-center py-2">
                    <div className="h-px w-6 bg-border" />
                  </div>
                )}

                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon
                    const hasChildren = !!(item.children?.length)

                    // ── Group (has children) ──────────────────────────────
                    if (hasChildren) {
                      const visibleChildren = item.children!.filter(childVisible)
                      if (visibleChildren.length === 0) return null
                      const anyChildActive = visibleChildren.some(c => isActive(c.href, c.exactMatch))
                      const isOpen = !!expandedGroups[item.href]

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger
                              render={
                                <Link
                                  href={visibleChildren[0]!.href}
                                  className={cn(
                                    'flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-colors',
                                    anyChildActive
                                      ? 'bg-card text-foreground ring-1 ring-inset ring-border shadow-sm'
                                      : 'text-muted-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground',
                                  )}
                                />
                              }
                            >
                              <Icon className="h-[18px] w-[18px] shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium text-xs">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return (
                        <div key={item.href}>
                          {/* Group header button */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(item.href)}
                            className={cn(
                              'group/btn flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              anyChildActive
                                ? 'text-foreground bg-card ring-1 ring-border shadow-sm'
                                : isOpen
                                  ? 'text-foreground bg-foreground/[0.05]'
                                  : 'text-muted-foreground/80 hover:bg-foreground/[0.045] hover:text-foreground',
                            )}
                          >
                            <Icon className={cn(
                              'h-[18px] w-[18px] shrink-0 transition-colors',
                              anyChildActive ? 'text-foreground' : isOpen ? 'text-foreground' : 'text-muted-foreground/60 group-hover/btn:text-foreground',
                            )} />
                            <span className="flex-1 truncate">{item.label}</span>
                            <ChevronDown className={cn(
                              'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                              anyChildActive ? 'text-foreground/40' : 'text-muted-foreground/35',
                              isOpen ? 'rotate-180' : 'rotate-0',
                            )} />
                          </button>

                          {/* Sub-items */}
                          {isOpen && (
                            <div className="mt-0.5 mb-1 space-y-0.5">
                              {visibleChildren.map(child => {
                                const childActive = isActive(child.href, child.exactMatch)
                                return (
                                  <Link key={child.href} href={child.href}
                                    className={cn(
                                      'flex items-center rounded-xl px-3 py-1.5 text-[13.5px] font-medium transition-all duration-150',
                                      childActive
                                        ? 'bg-card text-foreground ring-1 ring-inset ring-border shadow-sm'
                                        : 'text-muted-foreground/70 hover:bg-foreground/[0.045] hover:text-foreground',
                                    )}>
                                    {/* indent spacer: aligns child text under parent text (icon 18 + gap 12 = 30px) */}
                                    <span className="w-[30px] shrink-0" />
                                    <span className="truncate">{child.label}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // ── Leaf item ─────────────────────────────────────────
                    const active = isActive(item.href, item.exactMatch)

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger
                            render={
                              <Link
                                href={item.href}
                                className={cn(
                                  'flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-colors',
                                  active
                                    ? 'bg-card text-foreground ring-1 ring-inset ring-border shadow-sm'
                                    : 'text-muted-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground',
                                )}
                              />
                            }
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
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
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-150',
                          active
                            ? 'bg-card text-foreground ring-1 ring-inset ring-border shadow-sm'
                            : 'text-muted-foreground/80 hover:bg-foreground/[0.045] hover:text-foreground',
                        )}>
                        <Icon className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-foreground' : 'text-muted-foreground/60 group-hover:text-foreground',
                        )} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

      </aside>
    </TooltipProvider>
  )
}

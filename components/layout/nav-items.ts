import {
  LayoutDashboard,
  FileText,
  Users2,
  Users,
  Megaphone,
  Bell,
  BarChart3,
  ClipboardList,
  ShieldCheck,
  Database,
  CheckSquare,
  DollarSign,
  Percent,
  LayoutList,
  Radio,
  Share2,
  Wallet,
  Play,
  TrendingUp,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Permission } from '@/lib/rbac/permissions'

export interface NavChild {
  label: string
  href: string
  icon: LucideIcon
  exactMatch?: boolean
}

export interface NavItem {
  label: string
  href: string
  permission: Permission | null
  icon: LucideIcon
  exactMatch?: boolean
  children?: NavChild[]
}

export interface NavSection {
  label: string | null  // null = no section header
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', permission: null, icon: LayoutDashboard, exactMatch: true },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        label: 'Content',
        href: '/dashboard/content',
        permission: Permission.CONTENT_EDIT,
        icon: FileText,
        children: [
          { label: 'All Content',     href: '/dashboard/content',      icon: LayoutList, exactMatch: true },
          { label: 'Live Management', href: '/dashboard/content/live', icon: Radio },
        ],
      },
      { label: 'Social Connect', href: '/dashboard/social-connect', permission: Permission.CONTENT_PUBLISH, icon: Share2 },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Contributors',
        href: '/dashboard/contributors',
        permission: Permission.REPORTERS_MANAGE,
        icon: Users2,
        children: [
          { label: 'All Contributors',     href: '/dashboard/contributors',            icon: Users2, exactMatch: true },
          { label: 'Approval Management',  href: '/dashboard/contributors/approvals',  icon: CheckSquare },
          { label: 'Earnings Management',  href: '/dashboard/contributors/earnings',   icon: DollarSign },
          { label: 'Commission Rules',     href: '/dashboard/contributors/commission', icon: Percent },
          { label: 'Add Contributor',      href: '/dashboard/contributors/add',        icon: UserCheck },
        ],
      },
      { label: 'Users',     href: '/dashboard/users',     permission: Permission.USERS_VIEW, icon: Users },
      { label: 'Reporters', href: '/dashboard/reporters', permission: Permission.REPORTERS_MANAGE, icon: UserCheck },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { label: 'Ads',           href: '/dashboard/ads',           permission: Permission.ADS_MANAGE,      icon: Megaphone },
      { label: 'Finance',       href: '/dashboard/finance',       permission: Permission.FINANCE_VIEW,    icon: Wallet },
      { label: 'Notifications', href: '/dashboard/notifications', permission: Permission.CONTENT_PUBLISH, icon: Bell },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        permission: Permission.ANALYTICS_VIEW,
        icon: BarChart3,
        children: [
          { label: 'Content',   href: '/dashboard/analytics/content',  icon: FileText },
          { label: 'Reporters', href: '/dashboard/analytics/reporter', icon: Users2 },
          { label: 'Video',     href: '/dashboard/analytics/video',    icon: Play },
          { label: 'Ads',       href: '/dashboard/analytics/ads',      icon: TrendingUp },
        ],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Users & Roles', href: '/dashboard/settings/users-roles', permission: Permission.USERS_MANAGE,  icon: ShieldCheck },
      { label: 'Ref Data',      href: '/dashboard/settings/ref-data',    permission: Permission.ORG_CONFIGURE, icon: SlidersHorizontal },
      { label: 'Master Data',   href: '/dashboard/master-data',          permission: Permission.ORG_CONFIGURE, icon: Database },
      { label: 'Audit Log',     href: '/dashboard/audit-log',            permission: Permission.ORG_CONFIGURE, icon: ClipboardList },
    ],
  },
]

// Flat list for backwards compat (breadcrumbs, page title lookup)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

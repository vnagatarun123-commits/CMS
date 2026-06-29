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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Permission } from '@/lib/rbac/permissions'

export interface NavChild {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavItem {
  label: string
  href: string
  permission: Permission | null
  icon: LucideIcon
  exactMatch?: boolean
  children?: NavChild[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',          href: '/dashboard',                           permission: null,                        icon: LayoutDashboard, exactMatch: true },
  {
    label: 'Content',
    href: '/dashboard/content',
    permission: Permission.CONTENT_EDIT,
    icon: FileText,
    children: [
      { label: 'All Content',     href: '/dashboard/content',      icon: LayoutList },
      { label: 'Live Management', href: '/dashboard/content/live', icon: Radio },
    ],
  },
  {
    label: 'Contributors',
    href: '/dashboard/contributors',
    permission: Permission.REPORTERS_MANAGE,
    icon: Users2,
    children: [
      { label: 'Approval Management', href: '/dashboard/contributors/approvals', icon: CheckSquare },
      { label: 'Earnings Management', href: '/dashboard/contributors/earnings',  icon: DollarSign },
      { label: 'Commission Rules',    href: '/dashboard/contributors/commission', icon: Percent },
    ],
  },
  { label: 'Social Connect',      href: '/dashboard/social-connect',           permission: Permission.CONTENT_PUBLISH,   icon: Share2 },
  { label: 'Users',              href: '/dashboard/users',                     permission: Permission.USERS_VIEW,       icon: Users },
  { label: 'Ads',                href: '/dashboard/ads',                       permission: Permission.ADS_MANAGE,       icon: Megaphone },
  { label: 'Notifications',      href: '/dashboard/notifications',             permission: Permission.CONTENT_PUBLISH,  icon: Bell },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    permission: Permission.ANALYTICS_VIEW,
    icon: BarChart3,
    children: [
      { label: 'Content',   href: '/dashboard/analytics/content',  icon: FileText   },
      { label: 'Reporters', href: '/dashboard/analytics/reporter', icon: Users2     },
      { label: 'Video',     href: '/dashboard/analytics/video',    icon: Play       },
      { label: 'Ads',       href: '/dashboard/analytics/ads',      icon: TrendingUp },
    ],
  },
  { label: 'Finance',            href: '/dashboard/finance',                   permission: Permission.FINANCE_VIEW,     icon: Wallet },
  { label: 'Audit Log',          href: '/dashboard/audit-log',                 permission: Permission.ORG_CONFIGURE,    icon: ClipboardList },
  { label: 'Users & Roles',      href: '/dashboard/settings/users-roles',      permission: Permission.USERS_MANAGE,     icon: ShieldCheck },
  { label: 'Master Data',        href: '/dashboard/master-data',               permission: Permission.ORG_CONFIGURE,    icon: Database },
]

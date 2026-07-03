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
  UserCircle2,
  KeyRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Permission, pageCapabilities, submoduleCapabilities, type Capability } from '@/lib/rbac/permissions'

export interface NavChild {
  label: string
  href: string
  icon: LucideIcon
  exactMatch?: boolean
  // Granular capabilities that reveal this sub-tab. Shown if the user holds ANY.
  capabilities?: Capability[]
}

export interface NavItem {
  label: string
  href: string
  // Coarse Permission or granular Capability. null = always visible.
  // Grouped items (with children) use null and derive visibility from children.
  permission: Permission | Capability | null
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
        permission: null,
        icon: FileText,
        children: [
          { label: 'All Content',     href: '/dashboard/content',      icon: LayoutList, exactMatch: true, capabilities: submoduleCapabilities('content', 'all') },
          { label: 'Live Management', href: '/dashboard/content/live', icon: Radio,                        capabilities: submoduleCapabilities('content', 'live') },
        ],
      },
      { label: 'Social Connect', href: '/dashboard/social-connect', permission: 'social.queue:publish', icon: Share2 },
    ],
  },
  {
    label: 'People',
    items: [
      {
        label: 'Contributors',
        href: '/dashboard/contributors',
        permission: null,
        icon: Users2,
        children: [
          { label: 'Contributors List',    href: '/dashboard/contributors',            icon: Users2, exactMatch: true, capabilities: submoduleCapabilities('contributors', 'list') },
          { label: 'Contributor Requests', href: '/dashboard/contributors/approvals',  icon: CheckSquare,               capabilities: submoduleCapabilities('contributors', 'requests') },
          { label: 'Earnings Management',  href: '/dashboard/contributors/earnings',   icon: DollarSign,                capabilities: submoduleCapabilities('contributors', 'earnings') },
          { label: 'Commission Rules',     href: '/dashboard/contributors/commission', icon: Percent,                   capabilities: submoduleCapabilities('contributors', 'commission') },
        ],
      },
      { label: 'Users',     href: '/dashboard/users',     permission: Permission.USERS_VIEW, icon: Users },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { label: 'Ads',           href: '/dashboard/ads',           permission: Permission.ADS_MANAGE,      icon: Megaphone },
      { label: 'Finance',       href: '/dashboard/finance',       permission: Permission.FINANCE_VIEW,    icon: Wallet },
      { label: 'Notifications', href: '/dashboard/notifications', permission: 'notifications.push:send', icon: Bell },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        permission: null,
        icon: BarChart3,
        children: [
          { label: 'Content',   href: '/dashboard/analytics/content',  icon: FileText,    capabilities: pageCapabilities('analytics', 'content') },
          { label: 'Reporters', href: '/dashboard/analytics/reporter', icon: Users2,      capabilities: pageCapabilities('analytics', 'reporter') },
          { label: 'Video',     href: '/dashboard/analytics/video',    icon: Play,        capabilities: pageCapabilities('analytics', 'video') },
          { label: 'Ads',       href: '/dashboard/analytics/ads',      icon: TrendingUp,  capabilities: pageCapabilities('analytics', 'ads') },
        ],
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'My Profile',    href: '/dashboard/settings/profile',     permission: null,                     icon: UserCircle2 },
      { label: 'Security',      href: '/dashboard/settings/security',    permission: null,                     icon: KeyRound },
      { label: 'Users & Roles', href: '/dashboard/settings/users-roles', permission: Permission.USERS_MANAGE,  icon: ShieldCheck },
      { label: 'Master Data',   href: '/dashboard/master-data',          permission: Permission.ORG_CONFIGURE, icon: Database },
      { label: 'Audit Log',     href: '/dashboard/audit-log',            permission: Permission.ORG_CONFIGURE, icon: ClipboardList },
    ],
  },
]

// Flat list for backwards compat (breadcrumbs, page title lookup)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

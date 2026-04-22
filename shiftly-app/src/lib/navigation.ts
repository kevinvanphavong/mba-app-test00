import type { AuthUser } from '@/store/authStore'

export type NavItem = {
  href:         string
  label:        string
  icon:         string
  managerOnly:  boolean
  showOnMobile: boolean
  mobileOrder:  number
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',       icon: '⚡', managerOnly: true,  showOnMobile: true,  mobileOrder: 0 },
  { href: '/planning',  label: 'Planning',         icon: '📅', managerOnly: false, showOnMobile: true,  mobileOrder: 1 },
  { href: '/service',   label: 'Service du jour', icon: '📋', managerOnly: false, showOnMobile: true,  mobileOrder: 2 },
  { href: '/services',  label: 'Services',         icon: '🗓️', managerOnly: true,  showOnMobile: true,  mobileOrder: 3 },
  { href: '/pointage',            label: 'Pointage',         icon: '⏱️', managerOnly: true,  showOnMobile: true,  mobileOrder: 4 },
  { href: '/pointage/validation', label: 'Validation hebdo',  icon: '✓',  managerOnly: true,  showOnMobile: false, mobileOrder: 99 },
  { href: '/postes',    label: 'Postes',           icon: '🗂️', managerOnly: false, showOnMobile: true,  mobileOrder: 5 },
  { href: '/staff',     label: 'Staff',            icon: '👥', managerOnly: false, showOnMobile: true,  mobileOrder: 6 },
  { href: '/tutoriels', label: 'Tutoriels',        icon: '📖', managerOnly: false, showOnMobile: true,  mobileOrder: 7 },
  { href: '/reglages',  label: 'Réglages',         icon: '⚙️', managerOnly: false, showOnMobile: true,  mobileOrder: 8 },
]

export const DESKTOP_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS

export const MOBILE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS
  .filter(item => item.showOnMobile)
  .sort((a, b) => a.mobileOrder - b.mobileOrder)

export function filterNavByRole(items: NavItem[], role: AuthUser['role']): NavItem[] {
  return items.filter(item => !item.managerOnly || role === 'MANAGER')
}

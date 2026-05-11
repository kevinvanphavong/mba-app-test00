import type { AuthUser } from '@/store/authStore'

export type NavItem = {
  href:        string
  label:       string
  icon:        string
  managerOnly: boolean
}

// Liste unique partagée par la Sidebar desktop et le MobileDrawer.
export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',           label: 'Dashboard',         icon: '⚡', managerOnly: true  },
  { href: '/planning',            label: 'Planning',          icon: '📅', managerOnly: false },
  { href: '/service',             label: 'Service du jour',   icon: '📋', managerOnly: false },
  { href: '/services',            label: 'Services',          icon: '🗓️', managerOnly: true  },
  { href: '/pointage',            label: 'Pointage',          icon: '⏱️', managerOnly: true  },
  { href: '/pointage/validation', label: 'Validation hebdo',  icon: '✓',  managerOnly: true  },
  { href: '/postes',              label: 'Postes',            icon: '🗂️', managerOnly: false },
  { href: '/staff',               label: 'Staff',             icon: '👥', managerOnly: false },
  { href: '/tutoriels',           label: 'Tutoriels',         icon: '📖', managerOnly: false },
  { href: '/reglages',            label: 'Réglages',          icon: '⚙️', managerOnly: false },
]

export function filterNavByRole(items: NavItem[], role: AuthUser['role']): NavItem[] {
  return items.filter(item => !item.managerOnly || role === 'MANAGER')
}

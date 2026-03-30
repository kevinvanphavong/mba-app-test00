'use client'

import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  DESKTOP_NAV_ITEMS,
  MOBILE_NAV_ITEMS,
  filterNavByRole,
  type NavItem,
} from '@/lib/navigation'

export type NavItemWithActive = NavItem & { active: boolean }

function withActive(items: NavItem[], pathname: string): NavItemWithActive[] {
  return items.map(item => ({
    ...item,
    active:
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')),
  }))
}

export function useDesktopNavItems(): NavItemWithActive[] {
  const { user } = useCurrentUser()
  const pathname = usePathname()
  return withActive(filterNavByRole(DESKTOP_NAV_ITEMS, user?.role ?? 'EMPLOYE'), pathname)
}

export function useMobileNavItems(): NavItemWithActive[] {
  const { user } = useCurrentUser()
  const pathname = usePathname()
  return withActive(filterNavByRole(MOBILE_NAV_ITEMS, user?.role ?? 'EMPLOYE'), pathname)
}

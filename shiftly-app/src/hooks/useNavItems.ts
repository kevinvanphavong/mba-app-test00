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
  // Un item est candidat s'il matche le pathname (exact ou préfixe).
  // On ne garde actif QUE le match le plus long pour éviter qu'un item parent
  // (ex: /pointage) reste actif quand un enfant plus spécifique l'est aussi
  // (ex: /pointage/validation).
  const longestMatch = items
    .filter(item =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
    )
    .reduce((longest, item) => (item.href.length > longest.length ? item.href : longest), '')

  return items.map(item => ({ ...item, active: item.href === longestMatch }))
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

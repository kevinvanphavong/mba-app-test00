'use client'

import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ALL_NAV_ITEMS, filterNavByRole, type NavItem } from '@/lib/navigation'

export type NavItemWithActive = NavItem & { active: boolean }

function withActive(items: NavItem[], pathname: string): NavItemWithActive[] {
  // Un item est candidat s'il matche le pathname (exact ou préfixe).
  // On ne garde actif QUE le match le plus long pour éviter qu'un item parent
  // reste actif quand un enfant plus spécifique l'est aussi.
  const longestMatch = items
    .filter(item =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
    )
    .reduce((longest, item) => (item.href.length > longest.length ? item.href : longest), '')

  return items.map(item => ({ ...item, active: item.href === longestMatch }))
}

/**
 * Hook unique pour les items de navigation (Sidebar desktop + MobileDrawer).
 * Depuis la refonte burger menu, drawer et sidebar partagent les mêmes items.
 */
export function useNavItems(): NavItemWithActive[] {
  const { user } = useCurrentUser()
  const pathname = usePathname()
  return withActive(filterNavByRole(ALL_NAV_ITEMS, user?.role ?? 'EMPLOYE'), pathname)
}

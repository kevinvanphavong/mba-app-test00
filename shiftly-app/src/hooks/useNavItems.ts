'use client'

import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  ALL_NAV_ITEMS,
  filterNavByRole,
  SECTION_LABELS,
  SECTION_ORDER,
  type NavItem,
  type NavSection,
} from '@/lib/navigation'

export type NavItemWithActive = NavItem & { active: boolean }

export type NavSectionGroup = {
  id:    Exclude<NavSection, 'footer'>
  label: string
  items: NavItemWithActive[]
}

export type NavGroups = {
  sections: NavSectionGroup[]
  footer:   NavItemWithActive[]
}

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
 * Retourne les items regroupés par section + le footer séparé.
 *
 * Les sections vides (aucun item visible pour le rôle courant) sont filtrées :
 * un employé ne voit pas le header "Pilotage" si Dashboard est cachée.
 */
export function useNavItems(): NavGroups {
  const { user } = useCurrentUser()
  const pathname = usePathname()
  const filtered = filterNavByRole(ALL_NAV_ITEMS, user?.role ?? 'EMPLOYE')
  const withActiveFlag = withActive(filtered, pathname)

  const sections: NavSectionGroup[] = SECTION_ORDER
    .map(id => ({
      id,
      label: SECTION_LABELS[id],
      items: withActiveFlag.filter(it => it.section === id),
    }))
    .filter(s => s.items.length > 0)

  const footer = withActiveFlag.filter(it => it.section === 'footer')

  return { sections, footer }
}

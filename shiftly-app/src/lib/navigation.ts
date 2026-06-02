import type { AuthUser } from '@/store/authStore'

export type NavSection =
  | 'pilotage'
  | 'operations'
  | 'planification'
  | 'equipe'
  | 'footer'

export type NavItem = {
  href:        string
  label:       string
  icon:        string
  managerOnly: boolean
  section:     NavSection
}

// Liste unique partagée par la Sidebar desktop et le MobileDrawer.
// L'ordre dans le tableau définit l'ordre d'affichage à l'intérieur de chaque section.
export const ALL_NAV_ITEMS: NavItem[] = [
  // Pilotage
  { href: '/dashboard',           label: 'Dashboard',         icon: '⚡', managerOnly: true,  section: 'pilotage' },

  // Opérations
  { href: '/service',             label: 'Service du jour',   icon: '📋', managerOnly: false, section: 'operations' },
  { href: '/pointage',            label: 'Pointage',          icon: '⏱️', managerOnly: true,  section: 'operations' },
  { href: '/pointage/validation', label: 'Validation hebdo',  icon: '✓',  managerOnly: true,  section: 'operations' },

  // Planification
  { href: '/planning',            label: 'Planning',          icon: '📅', managerOnly: false, section: 'planification' },
  { href: '/services',            label: 'Services',          icon: '🗓️', managerOnly: true,  section: 'planification' },

  // Équipe
  { href: '/staff',               label: 'Staff',             icon: '👥', managerOnly: false, section: 'equipe' },
  { href: '/haccp',               label: 'HACCP',             icon: '🍔', managerOnly: false, section: 'equipe' },
  { href: '/postes',              label: 'Postes',            icon: '🗂️', managerOnly: false, section: 'equipe' },
  { href: '/tutoriels',           label: 'Tutoriels',         icon: '📖', managerOnly: false, section: 'equipe' },

  // Footer (hors regroupement par section : rendu séparément en bas de la sidebar)
  { href: '/reglages',            label: 'Réglages',          icon: '⚙️', managerOnly: false, section: 'footer' },
]

// Libellés affichés en tête de section dans la sidebar (mode expanded).
// La section "footer" n'a pas de label visible car rendue séparément.
export const SECTION_LABELS: Record<Exclude<NavSection, 'footer'>, string> = {
  pilotage:      'Pilotage',
  operations:    'Opérations',
  planification: 'Planification',
  equipe:        'Équipe',
}

// Ordre des sections principales de la sidebar (hors footer).
export const SECTION_ORDER: Exclude<NavSection, 'footer'>[] = [
  'pilotage',
  'operations',
  'planification',
  'equipe',
]

export function filterNavByRole(items: NavItem[], role: AuthUser['role']): NavItem[] {
  return items.filter(item => !item.managerOnly || role === 'MANAGER')
}

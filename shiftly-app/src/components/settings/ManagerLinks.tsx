'use client'

import Link          from 'next/link'
import { ty }        from '@/lib/typography'
import { useAuthStore } from '@/store/authStore'

const LINKS = [
  { href: '/reglages/editeur',       label: 'Gestion du contenu',     sub: 'Zones, missions, compétences, tutoriels' },
  { href: '/reglages/editeur-staff', label: 'Gestion du staff',       sub: 'Membres, rôles, tailles, activation'     },
  { href: '/reglages/incidents',     label: 'Gestion des incidents',  sub: 'Voir, modifier et clôturer les incidents'},
]

/** Section visible uniquement pour les managers */
export default function ManagerLinks() {
  const role = useAuthStore(s => s.user?.role)

  if (role !== 'MANAGER') return null

  return (
    <div className="mb-4">
      <div className={`${ty.sectionLabel} px-1 mb-2`}>
        Manager
      </div>
      <div className="bg-surface border border-border rounded-[18px] overflow-hidden divide-y divide-border">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface2 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className={`${ty.bodyLg} font-medium`}>{link.label}</div>
              <div className={ty.meta}>{link.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted flex-shrink-0">
              <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

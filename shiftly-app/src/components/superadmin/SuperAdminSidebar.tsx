'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useSupportStats } from '@/hooks/useSuperAdminSupport'

interface NavItem {
  label:    string
  href:     string
  icon:     string
  badge?:   string | number
  badgeMuted?: boolean
  disabled?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Phase 1 — Monitoring',
    items: [
      { label: 'Dashboard', href: '/superadmin',         icon: '📊' },
      { label: 'Centres',   href: '/superadmin/centres', icon: '🏢', badgeMuted: true },
    ],
  },
  {
    label: 'Phase 2 — Billing',
    items: [
      { label: 'Abonnements',      href: '/superadmin/subscriptions', icon: '💳', disabled: true },
      { label: 'Facturation',      href: '/superadmin/billing',       icon: '📄', disabled: true },
      { label: 'Plans tarifaires', href: '/superadmin/pricing',       icon: '🏷️', disabled: true },
    ],
  },
  {
    label: 'Phase 3 — Users & Support',
    items: [
      { label: 'Utilisateurs', href: '/superadmin/users',   icon: '👤' },
      { label: 'Support',      href: '/superadmin/support', icon: '🎧' },
    ],
  },
  {
    label: 'Phase 4 — Système',
    items: [
      { label: 'Activity', href: '/superadmin/activity', icon: '⚡', disabled: true },
      { label: 'Réglages', href: '/superadmin/settings', icon: '⚙️', disabled: true },
    ],
  },
]

export default function SuperAdminSidebar() {
  const pathname  = usePathname()
  const user      = useSuperAdminStore(s => s.user)
  const stats     = useSupportStats()

  const initials = user
    ? `${(user.prenom ?? '').charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : 'SA'

  const supportBadge = stats.data?.ouverts ?? 0

  return (
    <nav className="w-60 h-screen fixed top-0 left-0 bg-surface3 border-r border-border flex flex-col z-50 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-[22px] pb-[18px] border-b border-border">
        <div className="font-syne font-extrabold text-[22px]">
          <span className="bg-gradient-to-br from-accent to-accent-light bg-clip-text text-transparent">
            Shiftly
          </span>
          <span className="text-text">.</span>
        </div>
        <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-[1.3px] bg-gradient-to-br from-accent to-accent-light text-bg px-[9px] py-[3px] rounded-full">
          SuperAdmin
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-3.5 flex flex-col gap-0.5">
        {sections.map(section => (
          <div key={section.label}>
            <div className="text-[10px] font-bold uppercase tracking-[1.2px] text-muted px-3 pt-3.5 pb-1.5">
              {section.label}
            </div>
            {section.items.map(item => {
              const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href + '/'))
              const linkClass = [
                'flex items-center gap-2.5 px-3 py-2.5 text-[13px] rounded-lg transition-all border-l-[3px] -ml-[3px]',
                active
                  ? 'bg-accent/10 text-accent border-accent font-semibold'
                  : 'text-muted border-transparent hover:bg-surface hover:text-text',
                item.disabled ? 'opacity-50 pointer-events-none' : '',
              ].join(' ')

              // Badge dynamique pour Support
              const liveBadge = item.href === '/superadmin/support' && supportBadge > 0
                ? { value: supportBadge, muted: false }
                : item.badge !== undefined
                  ? { value: item.badge, muted: item.badgeMuted ?? false }
                  : null

              return (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  className={linkClass}
                >
                  <span className="text-[15px] w-[18px] text-center">{item.icon}</span>
                  <span>{item.label}</span>
                  {liveBadge && (
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-[10px] ${
                      liveBadge.muted ? 'bg-surface2 text-muted' : 'bg-red text-white'
                    }`}>
                      {liveBadge.value}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User card */}
      <div className="p-3.5 border-t border-border">
        <div className="bg-surface border border-border p-2.5 px-3 rounded-[10px] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light text-white font-bold flex items-center justify-center text-[13px]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold leading-tight truncate">
              {user ? `${user.prenom ?? ''} ${user.nom}`.trim() : 'SuperAdmin'}
            </div>
            <div className="text-[10px] text-accent uppercase tracking-[0.8px]">Fondateur</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

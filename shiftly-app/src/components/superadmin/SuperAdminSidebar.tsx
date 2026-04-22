'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSuperAdminLogout } from '@/hooks/useSuperAdminAuth'

const nav = [
  { label: 'Dashboard',     href: '/superadmin' },
  { label: 'Centres',       href: '/superadmin/centres' },
  { label: 'Abonnements',   href: '/superadmin/subscriptions', disabled: true },
  { label: 'Utilisateurs',  href: '/superadmin/users',         disabled: true },
  { label: 'Support',       href: '/superadmin/support',       disabled: true },
  { label: 'Activité',      href: '/superadmin/activity',      disabled: true },
  { label: 'Réglages',      href: '/superadmin/settings',      disabled: true },
]

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const logout   = useSuperAdminLogout()

  return (
    <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', height: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Shiftly</span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>SuperAdmin</span>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nav.map(({ label, href, disabled }) => {
          const active = !disabled && pathname === href
          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 14,
                color: disabled ? 'var(--muted)' : active ? 'var(--accent)' : 'var(--text)',
                background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
                pointerEvents: disabled ? 'none' : 'auto',
                textDecoration: 'none',
              }}
            >
              {label}
              {disabled && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--muted)' }}>bientôt</span>}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={logout}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

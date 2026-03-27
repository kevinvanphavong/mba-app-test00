'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const navItems = [
  { href: '/dashboard', label: 'Dashboard',       icon: '⚡' },
  { href: '/service',   label: 'Service du jour', icon: '📋' },
  { href: '/services',  label: 'Services',          icon: '📅' },
  { href: '/postes',    label: 'Postes',           icon: '🗂️' },
  { href: '/staff',     label: 'Staff',            icon: '👥' },
  { href: '/tutoriels', label: 'Tutoriels',        icon: '📖' },
  { href: '/reglages',  label: 'Réglages',         icon: '⚙️' },
]

function getInitials(nom: string): string {
  return nom
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatRole(role: string): string {
  return role === 'MANAGER' ? 'Manager' : 'Employé'
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, loading } = useCurrentUser()

  if (!user) return null

  const initials = getInitials(user.nom)
  const roleLabel = formatRole(user.role)

  return (
    <aside className="hidden lg:flex flex-col w-[220px] min-w-[220px] bg-surface border-r border-border px-3 py-6">
      {/* Logo */}
      <div className="px-3 mb-7">
        <div className="font-syne font-extrabold text-[20px] leading-none">
          <span className="text-accent">Shiftly</span>
          <span className="text-text">.</span>
        </div>
        <div className="text-[10px] text-muted mt-1 tracking-wide">Bowling Central</div>
      </div>

      {/* Section label */}
      <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted mb-1.5 px-3">
        Navigation
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                active
                  ? 'bg-accent/10 text-accent font-bold'
                  : 'text-muted hover:bg-surface2 hover:text-text'
              )}
            >
              <span className="text-[15px]">{item.icon}</span>
              <span className="flex-1 leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User row */}
      <div className="flex items-center gap-2.5 px-3 pt-4 border-t border-border mt-4">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white font-extrabold text-[11px] flex-shrink-0"
          style={{
          background: user.avatarColor
            ? `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}cc)`
            : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
        }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-text truncate leading-tight">{user.nom}</div>
          <div className="text-[10px] text-muted leading-tight">{roleLabel}</div>
        </div>
      </div>
    </aside>
  )
}

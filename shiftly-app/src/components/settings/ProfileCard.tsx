'use client'

import { useCurrentUser } from '@/hooks/useCurrentUser'

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

export default function ProfileCard() {
  const { user, loading } = useCurrentUser()

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-[18px] p-4 mb-4 flex items-center gap-3 animate-pulse">
        <div className="w-14 h-14 rounded-[16px] bg-surface2 flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-32 bg-surface2 rounded" />
          <div className="h-3 w-48 bg-surface2 rounded" />
          <div className="h-3 w-36 bg-surface2 rounded" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const initials = getInitials(user.prenom + ' ' + user.nom)
  const roleLabel = formatRole(user.role)
  const centreNom = user.centre?.nom ?? ''

  return (
    <div className="bg-surface border border-border rounded-[18px] p-4 mb-4 flex items-center gap-3">
      <div
        className="w-14 h-14 rounded-[16px] flex items-center justify-center text-white font-extrabold text-[16px] flex-shrink-0"
        style={{
          background: user.avatarColor
            ? `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}cc)`
            : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
        }}
      >
        {initials}
      </div>
      <div>
        <div className="font-syne font-extrabold text-[16px] text-text">{user.prenom} {user.nom}</div>
        <div className="text-[12px] text-muted">
          {roleLabel}{centreNom ? ` · ${centreNom}` : ''}
        </div>
        <div className="text-[11px] text-muted mt-0.5">{user.email}</div>
      </div>
    </div>
  )
}

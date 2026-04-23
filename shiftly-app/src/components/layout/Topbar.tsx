'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import NotificationBell from '@/components/layout/NotificationBell'

/** Barre supérieure mobile + desktop — date, centre, avatar utilisateur */
export default function Topbar() {
  const { user } = useCurrentUser()

  // Toujours la date réelle du jour (pas celle du service)
  const today   = new Date()
  const dayName = format(today, 'EEEE', { locale: fr })
  const dayFull = format(today, 'd MMMM yyyy', { locale: fr })

  const centreName  = user?.centre?.nom ?? '…'
  const avatarColor = user?.avatarColor ?? '#f97316'
  const initials    = user
    ? ((user.prenom[0] ?? '') + (user.nom[0] ?? '')).toUpperCase()
    : '…'

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3 lg:px-7 lg:pt-7 lg:pb-4">
      {/* Left — greeting + date */}
      <div>
        <p className="text-[11px] text-muted uppercase tracking-widest font-syne font-bold">
          {centreName}
        </p>
        <h1 className="font-syne font-extrabold text-[20px] lg:text-[24px] text-text leading-tight capitalize">
          {dayName}
          <span className="text-muted font-normal text-[14px] ml-2 normal-case">
            {dayFull}
          </span>
        </h1>
      </div>

      {/* Right — bell + avatar */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}
          title={user ? `${user.prenom} ${user.nom}` : ''}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}

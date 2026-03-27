'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useServiceToday } from '@/hooks/useService'

/** Barre supérieure mobile + desktop — date, centre, avatar utilisateur */
export default function Topbar() {
  const { user } = useCurrentUser()
  const serviceToday = useServiceToday()
  const dateReference = serviceToday.data?.service?.date ? new Date(serviceToday.data.service.date) : new Date()

  /** importer ici la fonction pour récupérer le service du jour 'findTodayActive' */
  const today   = dateReference ? dateReference : new Date()
  const dayName = format(today, 'EEEE', { locale: fr })
  const dayFull = format(today, 'd MMMM yyyy', { locale: fr })

  const centreName  = user?.centre?.nom ?? '…'
  const avatarColor = user?.avatarColor ?? '#f97316'
  const initials    = user
    ? user.nom.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
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

      {/* Right — user avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}
        title={user?.nom}
      >
        {initials}
      </div>
    </header>
  )
}

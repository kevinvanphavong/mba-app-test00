'use client'

import { ty } from '@/lib/typography'
import { getInitials } from '@/lib/userDisplay'
import type { HistoryStaffRow } from '@/types/eventlog'

interface Props {
  rows: HistoryStaffRow[]
}

/** Top 5 staff par nombre de checks sur la période. */
export default function HistoryStaffRanking({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className={`${ty.metaLg}`}>Pas d&apos;activité staff sur la période.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {rows.map((u, idx) => {
        const nom      = u.userNom ?? 'Utilisateur supprimé'
        const initials = getInitials(nom)
        const taux     = u.tauxPersonnel
        const tauxColor = taux >= 90 ? 'text-green' : taux >= 75 ? 'text-yellow' : 'text-red'

        return (
          <li
            key={`${u.userId ?? 'x'}-${idx}`}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
          >
            <div
              className="w-9 h-9 rounded-full inline-flex items-center justify-center font-syne font-extrabold text-[13px] text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`${ty.cardTitle} truncate`}>{nom}</div>
              <div className={`${ty.metaSm} mt-0.5`}>
                {u.checks} checks · {u.services} service{u.services > 1 ? 's' : ''}
              </div>
            </div>
            <div className={`font-syne font-extrabold text-[16px] ${tauxColor}`}>
              {taux.toFixed(1)}%
            </div>
          </li>
        )
      })}
    </ul>
  )
}

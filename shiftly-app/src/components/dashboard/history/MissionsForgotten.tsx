'use client'

import { ty } from '@/lib/typography'
import type { HistoryMissionForgotten } from '@/types/eventlog'

interface Props {
  rows: HistoryMissionForgotten[]
}

const PRIO_LABEL: Record<string, string> = {
  vitale:          'vitale',
  important:       'important',
  ne_pas_oublier:  'ne pas oublier',
}

/** Top 5 missions oubliées (par nombre de décochages). */
export default function MissionsForgotten({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className={`${ty.metaLg}`}>Aucune mission oubliée sur la période.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {rows.map((m, idx) => {
        const isTop3   = idx < 3
        const prioStr  = m.priorite ? (PRIO_LABEL[m.priorite] ?? m.priorite) : null
        const subParts = [m.zoneNom, prioStr].filter(Boolean).join(' · ')

        return (
          <li
            key={`${m.missionId ?? 'x'}-${idx}`}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
          >
            <span
              className={`w-[26px] h-[26px] rounded-[8px] inline-flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${
                isTop3 ? 'bg-red/15 text-red' : 'bg-surface2 text-muted'
              }`}
            >
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`${ty.cardTitle} truncate`}>{m.missionNom ?? 'Mission supprimée'}</div>
              {subParts && <div className={`${ty.metaSm} mt-0.5`}>{subParts}</div>}
            </div>
            <div className="font-syne font-extrabold text-[15px] text-red">
              {m.fois}<span className="text-[10px] text-muted font-semibold ml-0.5">x</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

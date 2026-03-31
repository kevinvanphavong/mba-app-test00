'use client'

import { useState } from 'react'
import Link from 'next/link'
import Panel from '@/components/ui/Panel'
import { ty } from '@/lib/typography'
import type { DashboardTopStaff } from '@/types/dashboard'

interface StaffRankingProps {
  topStaff: DashboardTopStaff[]
}

const RANK_MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

/** Panel — classement staff par points avec toggle managers/employés */
export default function StaffRanking({ topStaff }: StaffRankingProps) {
  const [showManagers, setShowManagers] = useState(true)

  // Filtrer selon le toggle
  const filtered = showManagers
    ? topStaff
    : topStaff.filter(u => u.role !== 'MANAGER')

  const max = Math.max(...filtered.map(u => u.points), 1)

  return (
    <Panel title="Top Staff">
      {/* Toggle managers / employés seulement */}
      <div className="flex items-center gap-1.5 mb-4 bg-surface2 rounded-[10px] p-1 w-fit">
        <button
          onClick={() => setShowManagers(true)}
          className={`${ty.label} px-3 py-1 rounded-[8px] transition-all ${
            showManagers
              ? 'bg-surface text-text shadow-sm'
              : 'text-muted hover:text-text'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setShowManagers(false)}
          className={`${ty.label} px-3 py-1 rounded-[8px] transition-all ${
            !showManagers
              ? 'bg-surface text-text shadow-sm'
              : 'text-muted hover:text-text'
          }`}
        >
          Employés
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className={`${ty.metaLg} py-3`}>Aucun employé dans la liste.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((member, idx) => {
            const initials = member.nom
              .split(' ')
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            const pct = Math.round((member.points / max) * 100)

            return (
              <div key={member.id} className="flex items-center gap-3">
                {/* Rang */}
                <div className="w-5 text-center flex-shrink-0">
                  {RANK_MEDAL[idx] !== undefined ? (
                    <span className="text-[14px]">{RANK_MEDAL[idx]}</span>
                  ) : (
                    <span className={`${ty.meta} font-bold`}>{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`${ty.badge} w-7 h-7 rounded-[8px] flex items-center justify-center text-white font-extrabold flex-shrink-0`}
                  style={{
                    background: member.avatarColor
                      ? `linear-gradient(135deg, ${member.avatarColor}, ${member.avatarColor}99)`
                      : 'linear-gradient(135deg, #f97316, #fb923c)',
                  }}
                >
                  {initials}
                </div>

                {/* Nom + barre */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`${ty.body} font-medium truncate`}>
                      {member.nom}
                    </span>
                    <span className={`${ty.statSyne} ml-2 flex-shrink-0`}>
                      {member.points} pts
                    </span>
                  </div>
                  <div className="h-[5px] bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: member.avatarColor
                          ? `linear-gradient(90deg, ${member.avatarColor}, ${member.avatarColor}99)`
                          : 'linear-gradient(90deg, #f97316, #fb923c)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lien vers la page staff */}
      <Link
        href="/staff"
        className={`${ty.meta} mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-[10px] border border-border hover:text-text hover:border-border/60 transition-all`}
      >
        Voir tout le staff
        <span className={ty.metaSm}>→</span>
      </Link>
    </Panel>
  )
}

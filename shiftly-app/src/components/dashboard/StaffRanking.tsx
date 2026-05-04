'use client'

import Link from 'next/link'
import Panel from '@/components/ui/Panel'
import { ty } from '@/lib/typography'
import { getInitials, getDisplayName } from '@/lib/userDisplay'
import type { DashboardTopStaff } from '@/types/dashboard'

interface StaffRankingProps {
  topStaff: DashboardTopStaff[]
}

const RANK_MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }
const TOP_LIMIT = 5

/** Panel V2 — « Progression équipe » : top 5 par points, sans toggle. */
export default function StaffRanking({ topStaff }: StaffRankingProps) {
  const visible = topStaff.slice(0, TOP_LIMIT)
  const max     = Math.max(...visible.map(u => u.points), 1)

  return (
    <Panel title="Progression équipe">
      {visible.length === 0 ? (
        <p className={`${ty.metaLg} py-3`}>Aucun employé dans la liste.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((member, idx) => {
            const initials = getInitials(member.nom, member.prenom)
            const pct      = Math.round((member.points / max) * 100)

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
                      {getDisplayName(member.nom, member.prenom)}
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
        Voir tout
        <span className={ty.metaSm}>→</span>
      </Link>
    </Panel>
  )
}

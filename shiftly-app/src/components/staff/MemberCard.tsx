'use client'

import { cn }              from '@/lib/cn'
import { ty }              from '@/lib/typography'
import { getGradientFromColor } from '@/lib/colors'
import LevelDots            from './LevelDots'
import MemberCardExpanded   from './MemberCardExpanded'
import type { StaffMember, StaffMeta } from '@/types/staff'

interface MemberCardProps {
  member:     StaffMember
  meta:       StaffMeta
  isExpanded: boolean
  onToggle:   (id: number) => void
}

function ZoneDot({ couleur }: { couleur: string | null }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: couleur ?? '#6b7280' }}
    />
  )
}

export default function MemberCard({ member, meta, isExpanded, onToggle }: MemberCardProps) {
  const initials  = (member.prenom?.[0] ?? member.nom[0]) + (member.nom.split(' ')[0]?.[0] ?? '')
  const gradient  = getGradientFromColor(member.avatarColor)

  // Niveau 1-5 = % de compétences acquises sur le total
  const niveau = meta.competencesTotal > 0
    ? Math.min(5, Math.max(1, Math.round((member.staffCompetences.length / meta.competencesTotal) * 5)))
    : 1

  // Zones uniques dérivées des compétences acquises
  const uniqueZones = Array.from(
    new Map(
      member.staffCompetences
        .filter(c => c.zoneName)
        .map(c => [c.zoneName!, c.zoneCouleur])
    ).entries()
  )

  return (
    <div
      className={cn(
        'bg-surface border rounded-[18px] p-4 transition-all duration-200 cursor-pointer select-none',
        isExpanded ? 'border-border/80 shadow-sm' : 'border-border hover:border-border/80',
        !member.actif && 'opacity-50'
      )}
      onClick={() => onToggle(member.id)}
    >
      {/* ── Collapsed row ── */}
      <div className="flex items-center gap-3">

        {/* Avatar + point de présence */}
        <div className="relative flex-shrink-0">
          {/* Wrapper coloré = border visible */}
          <div
            className="p-[2.5px] rounded-[14px]"
            style={{ background: member.avatarColor }}
          >
            <div
              className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center
                         text-white font-extrabold text-[14px]"
              style={{ background: gradient }}
            >
              {initials.toUpperCase()}
            </div>
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface',
              member.isPresent ? 'bg-green' : 'bg-surface2'
            )}
            title={member.isPresent ? 'Présent' : 'Absent'}
          />
        </div>

        {/* Nom + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`${ty.cardTitleMd} font-bold leading-tight`}>
              {member.prenom ? `${member.prenom} ${member.nom}` : member.nom}
            </span>
            {member.role === 'MANAGER' && (
              <span className={`${ty.badge} bg-accent/12 text-accent border border-accent/25 px-1.5 py-0.5 rounded-[5px]`}>
                MGR
              </span>
            )}
            {!member.actif && (
              <span className={`${ty.badge} bg-surface2 text-muted border border-border px-1.5 py-0.5 rounded-[5px]`}>
                Inactif
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={ty.statSyne}>{member.points} pts</span>
            <span className="text-[10px] text-muted">·</span>
            <LevelDots niveau={niveau} />
          </div>
        </div>

        {/* Zones + chevron */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            {uniqueZones.slice(0, 3).map(([nom, couleur]) => (
              <ZoneDot key={nom} couleur={couleur} />
            ))}
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={cn('text-muted transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Expanded content ── */}
      {isExpanded && <MemberCardExpanded member={member} meta={meta} />}
    </div>
  )
}

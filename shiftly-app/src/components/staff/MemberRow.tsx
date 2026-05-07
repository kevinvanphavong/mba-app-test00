'use client'

/**
 * MemberRow — Une ligne table desktop pour un membre du staff.
 * Cliquable pour expand. Mobile : grid s'effondre en flex-wrap (CSS).
 */

import { motion } from 'framer-motion'
import { getGradientFromColor } from '@/lib/colors'
import { calculerNiveau, staffInitials, POINTS_BAR_TARGET } from '@/lib/staff'
import type { StaffMember, StaffMeta } from '@/types/staff'

interface Props {
  member:     StaffMember
  meta:       StaffMeta
  isSelf:     boolean
  isExpanded: boolean
  onToggle:   (id: number) => void
}

function ProgressColumn({ value, total, accentClass }: { value: number; total: number; accentClass: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <>
      <div className="text-[12px] text-text font-semibold">{value}/{total}</div>
      <div className="w-[60px] h-1 rounded-full bg-surface2 overflow-hidden">
        <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${pct}%` }} />
      </div>
    </>
  )
}

export default function MemberRow({ member, meta, isSelf, isExpanded, onToggle }: Props) {
  const initials = staffInitials(member.prenom, member.nom)
  const gradient = getGradientFromColor(member.avatarColor)
  const niveau   = calculerNiveau(member.staffCompetences.length, meta.competencesTotal)
  const isManager = member.role === 'MANAGER'

  // Zones uniques où le membre a au moins une compétence
  const uniqueZones = Array.from(
    new Map(
      member.staffCompetences
        .filter(c => c.zoneName)
        .map(c => [c.zoneName!, c.zoneCouleur ?? '#6b7280'])
    ).entries()
  )

  const pointsPct = Math.min(100, Math.round((member.points / POINTS_BAR_TARGET) * 100))

  return (
    <motion.div
      layout
      onClick={() => onToggle(member.id)}
      className={[
        'staff-member-row cursor-pointer select-none',
        isExpanded ? 'expanded' : '', isSelf ? 'is-self' : '',
        !member.actif ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Col Membre */}
      <div className="col flex items-center gap-3 min-w-0">
        <div className="p-[2px] rounded-[12px] flex-shrink-0" style={{ background: member.avatarColor }}>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-extrabold text-[11px] tracking-wider"
               style={{ background: gradient }}>{initials}</div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-bold leading-tight">
              {member.prenom ? `${member.prenom} ${member.nom}` : member.nom}
            </span>
            {isSelf && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-accent/15 text-accent border border-accent/30">Vous</span>}
            {!member.actif && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-surface2 text-muted border border-border">Inactif</span>}
            <span className={`expand-marker text-[10px] text-accent transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
          {(member.typeContrat || member.heuresHebdo != null) && (
            <span className="text-[10px] text-muted mt-0.5">
              {member.typeContrat ?? '—'}{member.heuresHebdo != null && ` · ${member.heuresHebdo}h`}
            </span>
          )}
        </div>
      </div>

      {/* Col Rôle */}
      <div className="col">
        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
          isManager ? 'bg-accent/12 text-accent border-accent/30' : 'bg-surface2 text-muted border-border'
        }`}>{isManager ? 'Manager' : 'Membre'}</span>
      </div>

      {/* Col Zones maîtrisées */}
      <div className="col flex flex-wrap gap-1">
        {uniqueZones.length === 0
          ? <span className="text-[10px] text-muted">—</span>
          : uniqueZones.map(([nom, couleur]) => (
              <span key={nom}
                className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase tracking-wider border"
                style={{ background: `${couleur}1f`, borderColor: `${couleur}4d`, color: couleur }}>
                {nom}
              </span>
            ))}
      </div>

      {/* Col Niveau */}
      <div className="col flex items-center gap-2">
        <div className="flex gap-[3px]">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className="w-2 h-2 rounded-full"
              style={{ background: i <= niveau.palier ? 'var(--accent)' : 'var(--surface2)' }} />
          ))}
        </div>
        <span className="text-[11px] text-muted">{niveau.label}</span>
      </div>

      {/* Col Points */}
      <div className="col flex flex-col gap-1">
        <div className="font-syne font-extrabold text-accent text-[18px] leading-none">
          {member.points}<span className="text-[10px] font-bold text-muted ml-1">pts</span>
        </div>
        <div className="w-[60px] h-1 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pointsPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
        </div>
      </div>

      {/* Col Tutoriels */}
      <div className="col flex flex-col gap-1">
        <ProgressColumn value={member.tutorielsLus} total={meta.tutorielsTotal} accentClass="bg-accent" />
      </div>
    </motion.div>
  )
}

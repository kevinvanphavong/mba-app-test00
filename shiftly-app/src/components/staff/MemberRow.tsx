'use client'

/**
 * MemberRow — Une ligne table desktop pour un membre du staff.
 * Cliquable pour expand. Mobile : grid s'effondre en flex-wrap (CSS).
 *
 * Inactif : pas d'opacity globale, on désature les éléments colorés
 * (avatar, tags zone, dots niveau, points, jauges) pour garder le
 * texte lisible. Cf. docs/maquettes/staff-v4-etats.html.
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
    <div className="flex items-center gap-2.5">
      <div className="text-[12px] text-text font-semibold">{value}/{total}</div>
      <div className="w-[60px] h-1 rounded-full bg-surface2 overflow-hidden">
        <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function MemberRow({ member, meta, isSelf, isExpanded, onToggle }: Props) {
  const initials = staffInitials(member.prenom, member.nom)
  const niveau   = calculerNiveau(member.staffCompetences.length, meta.competencesTotal)
  const isManager = member.role === 'MANAGER'
  const inactive  = !member.actif

  // Avatar : gradient coloré pour les actifs, gris uni pour les inactifs
  const avatarBg = inactive ? 'var(--surface3)' : getGradientFromColor(member.avatarColor)

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
    <div
      onClick={() => onToggle(member.id)}
      className={[
        'staff-member-row cursor-pointer select-none',
        isExpanded ? 'expanded' : '',
      ].join(' ')}
    >
      {/* Col Membre */}
      <div className="col flex items-center gap-3.5 min-w-0">
        <div className="relative flex-shrink-0">
          <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-extrabold text-[13px] tracking-[0.4px] ${inactive ? 'text-muted border border-border' : 'text-white'}`}
               style={{ background: avatarBg }}>{initials}</div>
          <span className="presence-dot" data-present={member.isPresent && !inactive} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[14px] font-bold leading-[1.2] ${inactive ? 'text-muted' : ''}`}>
              {member.prenom ? `${member.prenom} ${member.nom}` : member.nom}
            </span>
            {isSelf && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-accent/15 text-accent border border-accent/30">Vous</span>}
            {inactive && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-surface2 text-muted border border-border">Inactif</span>}
          </div>
          {(member.typeContrat || member.heuresHebdo != null) && (
            <span className="text-[11px] text-muted mt-[3px]">
              {member.typeContrat ?? '—'}{member.heuresHebdo != null && ` · ${member.heuresHebdo}h`}
            </span>
          )}
        </div>
      </div>

      {/* Col Rôle */}
      <div className="col">
        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
          isManager && !inactive ? 'bg-accent/12 text-accent border-accent/30' : 'bg-surface2 text-muted border-border'
        }`}>{isManager ? 'Manager' : 'Membre'}</span>
      </div>

      {/* Col Zones maîtrisées */}
      <div className="col flex flex-wrap gap-1">
        {uniqueZones.length === 0
          ? <span className="text-[10px] text-muted">—</span>
          : uniqueZones.map(([nom, couleur]) => {
              const tagStyle = inactive
                ? { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--muted)' }
                : { background: `${couleur}1f`, borderColor: `${couleur}4d`, color: couleur }
              return (
                <span key={nom}
                  className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase tracking-wider border"
                  style={tagStyle}>
                  {nom}
                </span>
              )
            })}
      </div>

      {/* Col Niveau */}
      <div className="col flex items-center gap-2.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => {
            const on = i <= niveau.palier
            const bg = on ? (inactive ? 'var(--muted)' : 'var(--accent)') : 'var(--surface3)'
            return <span key={i} className="w-[9px] h-[9px] rounded-full" style={{ background: bg }} />
          })}
        </div>
        <span className="text-[12px] text-muted font-medium">{niveau.label}</span>
      </div>

      {/* Col Points */}
      <div className="col flex flex-col items-start gap-1.5">
        <div className={`font-syne font-extrabold text-[22px] leading-none ${inactive ? 'text-muted' : 'text-accent'}`}>
          {member.points}<span className="text-[11px] font-bold text-muted ml-[3px]">pts</span>
        </div>
        <div className="w-[70px] h-1 rounded-[2px] bg-surface2 overflow-hidden">
          <div className="h-full rounded-[2px]"
               style={{ width: `${pointsPct}%`, background: inactive ? 'var(--muted)' : 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
        </div>
      </div>

      {/* Col Tutoriels */}
      <div className="col">
        <ProgressColumn value={member.tutorielsLus} total={meta.tutorielsTotal} accentClass={inactive ? 'bg-muted' : 'bg-accent'} />
      </div>
    </div>
  )
}

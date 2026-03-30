import CompetenceList from './CompetenceList'
import type { StaffMember, StaffMeta } from '@/types/staff'

interface MemberCardExpandedProps {
  member: StaffMember
  meta:   StaffMeta
}

/**
 * Contenu déroulé : équipement · compétences acquises · taux tutoriels.
 */
export default function MemberCardExpanded({ member, meta }: MemberCardExpandedProps) {
  const tauxTuto = meta.tutorielsTotal > 0
    ? Math.round((member.tutorielsLus / meta.tutorielsTotal) * 100)
    : 0

  return (
    <div className="mt-3 pt-3 border-t border-border flex flex-col gap-3">

      {/* ── Équipement / tailles ── */}
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Équipement</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Haut',     value: member.tailleHaut },
            { label: 'Bas',      value: member.tailleBas  },
            { label: 'Pointure', value: member.pointure   },
          ].map(item => (
            <div key={item.label} className="bg-surface2 rounded-[10px] py-2 px-3 text-center">
              <div className="text-[10px] text-muted mb-0.5">{item.label}</div>
              <div className="font-syne font-extrabold text-[15px] text-text">
                {item.value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Compétences acquises ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Compétences</p>
          <span className="text-[11px] font-extrabold text-accent font-syne">
            {member.staffCompetences.length}
            {meta.competencesTotal > 0 && (
              <span className="font-normal text-muted">/{meta.competencesTotal}</span>
            )}
          </span>
        </div>
        <CompetenceList competences={member.staffCompetences} />
      </div>

      {/* ── Tutoriels ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Tutoriels lus</p>
          <span className="text-[11px] text-muted">{member.tutorielsLus}/{meta.tutorielsTotal}</span>
        </div>
        <div className="h-[5px] bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${tauxTuto}%`,
              background: tauxTuto === 100 ? '#22c55e' : tauxTuto >= 50 ? '#f97316' : '#eab308',
            }}
          />
        </div>
        <p className="text-[10px] text-muted mt-1">{tauxTuto}% complété</p>
      </div>
    </div>
  )
}

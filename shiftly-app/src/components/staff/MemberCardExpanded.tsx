import { ty } from '@/lib/typography'
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
        <p className={`${ty.sectionLabelMd} mb-2`}>Équipement</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Haut',     value: member.tailleHaut },
            { label: 'Bas',      value: member.tailleBas  },
            { label: 'Pointure', value: member.pointure   },
          ].map(item => (
            <div key={item.label} className="bg-surface2 rounded-[10px] py-2 px-3 text-center">
              <div className={`${ty.metaSm} mb-0.5`}>{item.label}</div>
              <div className={ty.kpiSm}>
                {item.value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Compétences acquises ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={ty.sectionLabelMd}>Compétences</p>
          <span className={`${ty.meta} font-extrabold text-accent font-syne`}>
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
          <p className={ty.sectionLabelMd}>Tutoriels lus</p>
          <span className={ty.meta}>{member.tutorielsLus}/{meta.tutorielsTotal}</span>
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
        <p className={`${ty.metaSm} mt-1`}>{tauxTuto}% complété</p>
      </div>
    </div>
  )
}

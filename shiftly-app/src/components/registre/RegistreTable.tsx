'use client'

import type { StaffMember } from '@/types/staff'
import { ty } from '@/lib/typography'
import { CONTRAT_PILL_CLASS, MOTIF_LABELS, fmtFRDate, fullName, initials } from './registreMeta'
import CompletudeBadge from './CompletudeBadge'

interface Props {
  members: StaffMember[]
  onEdit:  (m: StaffMember) => void
  onDocs:  (m: StaffMember) => void
}

export default function RegistreTable({ members, onEdit, onDocs }: Props) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <span className="text-4xl mb-3">🔍</span>
        <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun salarié trouvé</p>
        <p className={ty.metaLg}>Modifie la recherche ou change d&apos;onglet.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
      <div className="hidden tablet:grid grid-cols-[60px_1.6fr_1.2fr_90px_120px_120px_140px_72px] gap-3 px-4 py-3 border-b border-border bg-surface2 text-[10px] font-bold uppercase tracking-[1.2px] text-muted">
        <div>#</div>
        <div>Salarié</div>
        <div>Emploi</div>
        <div>Contrat</div>
        <div>Date entrée</div>
        <div>Date sortie</div>
        <div>Motif</div>
        <div className="text-right">Actions</div>
      </div>
      {members.map((m, idx) => {
        const isSorti = m.dateSortie !== null
        const rank    = String(idx + 1).padStart(2, '0')
        const pill    = CONTRAT_PILL_CLASS[m.typeContrat ?? ''] ?? 'bg-muted/15 text-muted border-muted/30'

        return (
          <div
            key={m.id}
            onClick={() => onEdit(m)}
            className={`grid grid-cols-1 tablet:grid-cols-[60px_1.6fr_1.2fr_90px_120px_120px_140px_72px] gap-3 px-4 py-3.5 border-b border-border/60 last:border-0 hover:bg-surface2/60 cursor-pointer transition-colors ${isSorti ? 'opacity-60' : ''}`}
          >
            <div className="hidden tablet:block font-syne font-bold text-[13px] text-muted">{rank}</div>

            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                style={{ backgroundColor: m.avatarColor }}
              >
                {initials(m.prenom, m.nom)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13.5px] text-text truncate">{fullName(m.prenom, m.nom)}</span>
                  <CompletudeBadge completude={m.completude} />
                </div>
                <div className="text-[11px] text-muted truncate">
                  {m.email} · {m.sexe ?? '?'} · {m.nationalite ?? '—'}
                </div>
              </div>
            </div>

            <div className="text-[13px] text-text truncate">{m.emploi ?? '—'}</div>

            <div>
              {m.typeContrat ? (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-bold border ${pill}`}>
                  {m.typeContrat}
                </span>
              ) : <span className="text-muted text-[12px]">—</span>}
            </div>

            <div className="text-[12.5px] text-muted">{fmtFRDate(m.dateEmbauche)}</div>
            <div className="text-[12.5px] text-muted">{fmtFRDate(m.dateSortie)}</div>

            <div>
              {m.motifSortie ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-red/15 text-red border border-red/30">
                  {MOTIF_LABELS[m.motifSortie]}
                </span>
              ) : <span className="text-muted text-[12px]">—</span>}
            </div>

            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onDocs(m)}
                aria-label="Documents & contrats"
                title="Documents & contrats"
                className="w-8 h-8 rounded-[8px] border border-border bg-surface2 text-muted hover:text-accent hover:border-accent/40 transition-colors flex items-center justify-center text-[14px]"
              >📎</button>
              <button
                type="button"
                onClick={() => onEdit(m)}
                aria-label="Modifier la fiche RH"
                title="Modifier la fiche RH"
                className="w-8 h-8 rounded-[8px] border border-border bg-surface2 text-muted hover:text-accent hover:border-accent/40 transition-colors flex items-center justify-center text-[14px]"
              >✎</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

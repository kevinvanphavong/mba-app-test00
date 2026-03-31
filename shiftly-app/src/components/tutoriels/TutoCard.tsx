'use client'

import { cn }                        from '@/lib/cn'
import { ty }                        from '@/lib/typography'
import { hexAlpha }                  from '@/lib/colors'
import ReadIndicator                 from './ReadIndicator'
import TutoCardExpanded              from './TutoCardExpanded'
import type { Tutoriel, TutoNiveau } from '@/types/tutoriel'

const NIVEAU_CFG: Record<TutoNiveau, { label: string; cls: string }> = {
  debutant:      { label: 'Débutant',      cls: 'text-green  bg-green/10  border-green/20'  },
  intermediaire: { label: 'Intermédiaire', cls: 'text-accent bg-accent/10 border-accent/20' },
  avance:        { label: 'Avancé',        cls: 'text-purple bg-purple/10 border-purple/20' },
}

interface TutoCardProps {
  tuto:       Tutoriel
  isExpanded: boolean
  onToggle:   (id: number) => void
}

export default function TutoCard({ tuto, isExpanded, onToggle }: TutoCardProps) {
  const zoneColor  = tuto.zone?.couleur ?? '#6b7280'
  const zoneNom    = tuto.zone?.nom ?? null
  const niveauCfg  = NIVEAU_CFG[tuto.niveau]
  const stepCount  = tuto.contenu.filter(b => b.type === 'step').length

  return (
    <div
      className={cn(
        'bg-surface border rounded-[18px] p-4 cursor-pointer select-none',
        'transition-all duration-200',
        isExpanded ? 'border-border/80' : 'border-border hover:border-border/60'
      )}
      onClick={() => onToggle(tuto.id)}
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-3">
        {/* Zone color bar */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[40px]"
          style={{ background: zoneColor }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {zoneNom ? (
              <span
                className={`${ty.badge} px-1.5 py-0.5 rounded-[4px] border`}
                style={{ color: zoneColor, background: hexAlpha(zoneColor, 0.09), borderColor: hexAlpha(zoneColor, 0.21) }}
              >
                {zoneNom}
              </span>
            ) : (
              <span className={`${ty.badge} px-1.5 py-0.5 rounded-[4px] border border-border text-muted`}>
                Aucune zone
              </span>
            )}
            <span className={cn(`${ty.badge} px-1.5 py-0.5 rounded-[4px] border`, niveauCfg.cls)}>
              {niveauCfg.label}
            </span>
            <span className={`${ty.metaSm} ml-auto`}>⏱ {tuto.dureMin} min</span>
          </div>

          {/* Title */}
          <p className={`${ty.cardTitle} leading-snug pr-2`}>
            {tuto.titre}
          </p>

          {/* Footer meta */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={ty.metaSm}>{stepCount} étape{stepCount > 1 ? 's' : ''}</span>
            {/* Chevron */}
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={cn('text-muted transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Read indicator */}
        <ReadIndicator
          tutoId={tuto.id}
          readId={tuto.readId ?? null}
        />
      </div>

      {/* ── Expanded content ── */}
      {isExpanded && <TutoCardExpanded contenu={tuto.contenu} />}
    </div>
  )
}

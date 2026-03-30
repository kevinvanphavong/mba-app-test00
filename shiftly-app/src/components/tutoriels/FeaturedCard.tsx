'use client'

import { cn }                        from '@/lib/cn'
import { hexAlpha }                  from '@/lib/colors'
import ReadIndicator                 from './ReadIndicator'
import TutoCardExpanded              from './TutoCardExpanded'
import type { Tutoriel, TutoNiveau } from '@/types/tutoriel'

const NIVEAU_CFG: Record<TutoNiveau, { label: string; cls: string }> = {
  debutant:      { label: 'Débutant',      cls: 'text-green  bg-green/10  border-green/20'  },
  intermediaire: { label: 'Intermédiaire', cls: 'text-accent bg-accent/10 border-accent/20' },
  avance:        { label: 'Avancé',        cls: 'text-purple bg-purple/10 border-purple/20' },
}

interface FeaturedCardProps {
  tuto:       Tutoriel
  isExpanded: boolean
  onToggle:   (id: number) => void
}

/** Carte "à la une" — accent-bar orange, plus grande, badge spécial */
export default function FeaturedCard({ tuto, isExpanded, onToggle }: FeaturedCardProps) {
  const zoneColor = tuto.zone?.couleur ?? '#6b7280'
  const zoneNom   = tuto.zone?.nom ?? null
  const niveauCfg = NIVEAU_CFG[tuto.niveau]
  const stepCount = tuto.contenu.filter(b => b.type === 'step').length

  return (
    <div
      className={cn(
        'relative bg-surface border rounded-[18px] p-4 overflow-hidden cursor-pointer select-none',
        'accent-bar transition-all duration-200',
        isExpanded ? 'border-accent/30' : 'border-border hover:border-accent/20'
      )}
      onClick={() => onToggle(tuto.id)}
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* ── Top row: "À la une" + read indicator ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold font-syne text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-[6px]">
              ⭐ À la une
            </span>
            {zoneNom ? (
              <span
                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px] border"
                style={{ color: zoneColor, background: hexAlpha(zoneColor, 0.09), borderColor: hexAlpha(zoneColor, 0.21) }}
              >
                {zoneNom}
              </span>
            ) : (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px] border border-border text-muted">
                Aucune zone
              </span>
            )}
          </div>
          <ReadIndicator
            tutoId={tuto.id}
            readId={tuto.readId ?? null}
          />
        </div>

        {/* ── Title ── */}
        <h2 className="font-syne font-extrabold text-[16px] text-text leading-snug mb-2">
          {tuto.titre}
        </h2>

        {/* ── Meta badges ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px] border', niveauCfg.cls)}>
            {niveauCfg.label}
          </span>
          <span className="text-[10px] text-muted">⏱ {tuto.dureMin} min</span>
          <span className="text-[10px] text-muted">·</span>
          <span className="text-[10px] text-muted">{stepCount} étapes</span>

          {/* Chevron */}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={cn('text-muted ml-auto transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Expanded content ── */}
      {isExpanded && <TutoCardExpanded contenu={tuto.contenu} />}
    </div>
  )
}

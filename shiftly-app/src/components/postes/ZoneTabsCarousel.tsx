'use client'

import type { Zone } from '@/types/index'

// ─── Carousel horizontal des zones (desktop) ──────────────────────────────────
// 3 à 4 cards visibles selon la largeur de l'écran. Scroll horizontal pour
// le reste, avec scroll-snap pour aligner proprement les cards.

interface Props {
  zones:        Zone[]
  activeZoneId: number | null
  /** Compteurs par zone : { [zoneId]: { missions, competences } } */
  counters:     Record<number, { missions: number; competences: number }>
  onSelect:     (zone: Zone) => void
}

export default function ZoneTabsCarousel({ zones, activeZoneId, counters, onSelect }: Props) {
  return (
    <div
      className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1"
      // scroll fluide et alignement propre côté navigateurs modernes
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {zones.map(zone => {
        const isActive = activeZoneId === zone.id
        const cnt      = counters[zone.id] ?? { missions: 0, competences: 0 }
        const color    = zone.couleur ?? 'var(--muted)'

        return (
          <button
            key={zone.id}
            onClick={() => onSelect(zone)}
            className="flex-shrink-0 snap-start text-left p-4 rounded-[13px] border transition-all bg-surface min-w-[260px]"
            // Largeur calculée pour viser 4 cards visibles sur écran large
            // tout en gardant un plancher lisible.
            style={{
              width:      'calc((100% - 36px) / 4)',
              minWidth:   260,
              borderColor: isActive ? color : 'var(--border)',
              background:  isActive ? `${color}14` : 'var(--surface)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                style={{ background: color }}
              />
              <span
                className="font-syne font-extrabold text-[14px]"
                style={{ color: isActive ? color : 'var(--text)' }}
              >
                {zone.nom}
              </span>
            </div>
            <div className="text-[11px] text-muted leading-snug mb-2 line-clamp-2 min-h-[28px]">
              Zone opérationnelle · contenu et compétences associés
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-syne font-bold text-text">
                {cnt.missions} <span className="font-normal text-muted">tâche{cnt.missions > 1 ? 's' : ''}</span>
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-muted opacity-50" />
              <span className="font-syne font-bold text-text">
                {cnt.competences} <span className="font-normal text-muted">compétence{cnt.competences > 1 ? 's' : ''}</span>
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

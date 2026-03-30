'use client'

import { cn }        from '@/lib/cn'
import { hexAlpha }  from '@/lib/colors'
import type { ZoneFilter, NiveauFilter, TutoNiveau } from '@/types/tutoriel'
import type { Zone } from '@/types/index'

const NIVEAUX: Array<{ value: TutoNiveau; label: string; cls: string; activeCls: string }> = [
  { value: 'debutant',      label: 'Débutant',      cls: 'text-muted border-border/50', activeCls: 'text-green  bg-green/10  border-green/30'  },
  { value: 'intermediaire', label: 'Intermédiaire', cls: 'text-muted border-border/50', activeCls: 'text-accent bg-accent/10 border-accent/30' },
  { value: 'avance',        label: 'Avancé',        cls: 'text-muted border-border/50', activeCls: 'text-purple bg-purple/10 border-purple/30' },
]

interface TutoFiltersProps {
  zones:         Zone[]
  zoneFilter:    ZoneFilter
  niveauFilter:  NiveauFilter
  onZoneChange:  (v: ZoneFilter)   => void
  onNiveauChange:(v: NiveauFilter) => void
}

/**
 * Double filtre tutoriels :
 *  - Row 1 : zones dynamiques depuis la BDD (Toutes / Zone1 / Zone2…)
 *  - Row 2 : niveaux (Tous / Débutant / Intermédiaire / Avancé)
 */
export default function TutoFilters({
  zones,
  zoneFilter,
  niveauFilter,
  onZoneChange,
  onNiveauChange,
}: TutoFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Zone row */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onZoneChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-[9px] text-[11px] font-bold border transition-all duration-150',
            zoneFilter === 'all'
              ? 'bg-surface2 text-text border-border'
              : 'text-muted border-border/40 hover:border-border'
          )}
        >
          Toutes zones
        </button>
        {zones.map(zone => {
          const color  = zone.couleur ?? '#6b7280'
          const active = zoneFilter === zone.nom
          return (
            <button
              key={zone.id}
              onClick={() => onZoneChange(active ? 'all' : zone.nom)}
              className="px-3 py-1.5 rounded-[9px] text-[11px] font-bold border transition-all duration-150"
              style={
                active
                  ? { color, background: hexAlpha(color, 0.09), borderColor: hexAlpha(color, 0.31) }
                  : { color: '#6b7280', borderColor: 'rgba(37,42,58,0.4)' }
              }
            >
              {zone.nom}
            </button>
          )
        })}
      </div>

      {/* Niveau row */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => onNiveauChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-[9px] text-[11px] font-bold border transition-all duration-150',
            niveauFilter === 'all'
              ? 'bg-surface2 text-text border-border'
              : 'text-muted border-border/40 hover:border-border'
          )}
        >
          Tous niveaux
        </button>
        {NIVEAUX.map(n => (
          <button
            key={n.value}
            onClick={() => onNiveauChange(niveauFilter === n.value ? 'all' : n.value)}
            className={cn(
              'px-3 py-1.5 rounded-[9px] text-[11px] font-bold border transition-all duration-150',
              niveauFilter === n.value ? n.activeCls : n.cls
            )}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

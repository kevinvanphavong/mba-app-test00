'use client'

import { cn }        from '@/lib/cn'
import { hexAlpha }  from '@/lib/colors'
import type { RoleFilter, ZoneFilter } from '@/types/staff'

const ROLE_TABS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'all',     label: 'Tous'    },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'EMPLOYE', label: 'Employé' },
]

interface ZoneOption { nom: string; couleur: string | null }

interface FilterTabsProps {
  roleFilter:   RoleFilter
  zoneFilter:   ZoneFilter
  zones:        ZoneOption[]
  onRoleChange: (v: RoleFilter) => void
  onZoneChange: (v: ZoneFilter) => void
}

/**
 * Double filtre :
 *  - Row 1 : Tous / Manager / Employé (pill tabs)
 *  - Row 2 : Toutes / zones dynamiques (chips)
 */
export default function FilterTabs({ roleFilter, zoneFilter, zones, onRoleChange, onZoneChange }: FilterTabsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Role row */}
      <div className="flex gap-1.5">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => onRoleChange(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-[9px] text-[12px] font-bold transition-all duration-150',
              roleFilter === tab.value
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface border border-border text-muted hover:text-text hover:border-border/80'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zone row */}
      {zones.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onZoneChange('all')}
            className={cn(
              'px-3 py-1 rounded-[8px] text-[11px] font-bold border transition-all duration-150',
              zoneFilter === 'all'
                ? 'bg-surface2 text-text border-border'
                : 'bg-transparent text-muted border-border/50 hover:border-border'
            )}
          >
            Toutes zones
          </button>
          {zones.map(zone => {
            const color  = zone.couleur ?? '#6b7280'
            const active = zoneFilter === zone.nom
            return (
              <button
                key={zone.nom}
                onClick={() => onZoneChange(active ? 'all' : zone.nom)}
                className="px-3 py-1 rounded-[8px] text-[11px] font-bold border transition-all duration-150"
                style={
                  active
                    ? { color, background: hexAlpha(color, 0.09), borderColor: hexAlpha(color, 0.31) }
                    : { color: '#6b7280', borderColor: 'rgba(37,42,58,0.5)' }
                }
              >
                {zone.nom}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

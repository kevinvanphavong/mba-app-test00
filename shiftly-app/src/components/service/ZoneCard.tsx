'use client'

import { cn }         from '@/lib/cn'
import MissionItem    from './MissionItem'
import type { ServiceZoneData, ServiceZone } from '@/types/service'

interface ZoneCardProps {
  zone:             ServiceZoneData
  completions:      Record<number, boolean>  // missionId → completed
  loadingMissions:  Set<number>
  onToggle:         (missionId: number, completed: boolean, zoneId: number) => void
  onAddPonctuelle?: (zone: ServiceZone) => void
  onAssign?:        (zone: ServiceZone) => void   // MANAGER : assigner un membre
  onRemoveStaff?:   (posteId: number) => void     // MANAGER : retirer un membre
}

export default function ZoneCard({
  zone,
  completions,
  loadingMissions,
  onToggle,
  onAddPonctuelle,
  onAssign,
  onRemoveStaff,
}: ZoneCardProps) {
  const totalMissions = zone.missions.length
  const doneMissions  = zone.missions.filter(m => completions[m.id]).length
  const pct           = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden">
      {/* ── Zone header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: zone.couleur }}
          />
          <h3
            className="font-syne font-extrabold text-[14px] uppercase tracking-wide"
            style={{ color: zone.couleur }}
          >
            {zone.nom}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">{doneMissions}/{totalMissions}</span>
          <span
            className={cn(
              'text-[10px] font-extrabold px-2 py-0.5 rounded-[6px]',
              pct === 100
                ? 'text-green bg-green/10'
                : pct >= 50
                ? 'text-yellow bg-yellow/10'
                : 'text-muted bg-surface2'
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Zone progress bar */}
      <div className="px-4 mb-3">
        <div className="h-[4px] bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: zone.couleur }}
          />
        </div>
      </div>

      {/* Staff row */}
      <div className="flex items-center gap-1.5 px-4 mb-3 flex-wrap">
        {zone.postes.map(poste => {
          if (!poste.user) return null
          const { user } = poste
          const initials = user.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

          return (
            <div
              key={poste.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[8px] border group"
              style={{
                background:  `${user.avatarColor}15`,
                borderColor: `${user.avatarColor}30`,
              }}
            >
              <div
                className="w-5 h-5 rounded-[5px] flex items-center justify-center text-white font-extrabold text-[9px] flex-shrink-0"
                style={{ background: user.avatarColor }}
              >
                {initials}
              </div>
              <span
                className="text-[11px] font-semibold"
                style={{ color: user.avatarColor }}
              >
                {user.nom}
              </span>
              {/* Bouton retirer — visible au hover ou tap (MANAGER seulement) */}
              {onRemoveStaff && (
                <button
                  onClick={e => { e.stopPropagation(); onRemoveStaff(poste.id) }}
                  className="w-3.5 h-3.5 rounded-full bg-red/20 text-red flex items-center justify-center
                             text-[8px] font-extrabold leading-none
                             opacity-0 group-hover:opacity-100 transition-opacity duration-150
                             hover:bg-red/40 active:scale-90 ml-0.5"
                  title={`Retirer ${user.nom} de la zone`}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}

        {/* Bouton assigner */}
        {onAssign && (
          <button
            onClick={() => onAssign(zone)}
            className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-dashed border-border
                       text-[11px] font-semibold text-muted hover:text-text hover:border-border/80
                       transition-colors duration-150"
          >
            <span className="text-[13px] font-bold leading-none">+</span>
            Assigner
          </button>
        )}
      </div>

      {/* ── Missions ── */}
      <div className="px-3 pb-3 flex flex-col gap-1">
        {/* Bouton mission ponctuelle */}
        {onAddPonctuelle && (
          <button
            onClick={() => onAddPonctuelle(zone)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-dashed border-border
                       text-[11px] font-semibold text-muted hover:text-text hover:border-border/80
                       transition-colors duration-150 mb-1"
          >
            <span className="text-[13px] font-bold">+</span>
            Ajouter une mission ponctuelle
          </button>
        )}

        {zone.missions.map(mission => (
          <MissionItem
            key={mission.id}
            mission={mission}
            completed={!!completions[mission.id]}
            loading={loadingMissions.has(mission.id)}
            onToggle={(missionId, currentlyCompleted) =>
              onToggle(missionId, currentlyCompleted, zone.id)
            }
          />
        ))}

        {zone.missions.length === 0 && (
          <p className="text-[12px] text-muted text-center py-3">
            Aucune mission pour cette zone.
          </p>
        )}
      </div>
    </div>
  )
}

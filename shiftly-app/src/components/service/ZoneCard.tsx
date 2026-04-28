'use client'

import { useState }  from 'react'
import { motion }    from 'framer-motion'
import { cn }        from '@/lib/cn'
import MissionItem   from './MissionItem'
import { getInitials, getDisplayName } from '@/lib/userDisplay'
import type { ServiceZoneData, ServiceZone } from '@/types/service'

const PREVIEW_COUNT  = 3
const COLLAPSED_H    = 160   // ~2,5 missions visibles → dégradé coupe la 3ème

interface ZoneCardProps {
  zone:             ServiceZoneData
  completions:      Record<number, boolean>
  loadingMissions:  Set<number>
  onToggle:         (missionId: number, completed: boolean, zoneId: number) => void
  onAddPonctuelle?: (zone: ServiceZone) => void
  onAssign?:        (zone: ServiceZone) => void
  onRemoveStaff?:   (posteId: number) => void
  /** Ouvre la modal de capture photo pour une mission requiresPhoto. Le posteId est résolu depuis la zone. */
  onCapturePhoto?:  (mission: ServiceZoneData['missions'][number], posteId: number) => void
  /** Ouvre la lightbox plein écran sur la preuve photo d'une completion. */
  onOpenPhoto?:     (completionId: number) => void
}

export default function ZoneCard({
  zone, completions, loadingMissions, onToggle,
  onAddPonctuelle, onAssign, onRemoveStaff,
  onCapturePhoto, onOpenPhoto,
}: ZoneCardProps) {
  const totalMissions = zone.missions.length
  const doneMissions  = zone.missions.filter(m => completions[m.id]).length
  const pct           = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0
  const hasMore       = zone.missions.length > PREVIEW_COUNT
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: zone.couleur }} />
          <h3 className="font-syne font-extrabold text-[14px] uppercase tracking-wide" style={{ color: zone.couleur }}>
            {zone.nom}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted">{doneMissions}/{totalMissions}</span>
          <span className={cn(
            'text-[13px] font-extrabold px-2 py-0.5 rounded-[6px]',
            pct === 100 ? 'text-green bg-green/10' : pct >= 50 ? 'text-yellow bg-yellow/10' : 'text-muted bg-surface2'
          )}>{pct}%</span>
        </div>
      </div>

      {/* ── Barre de progression ── */}
      <div className="px-4 mb-3">
        <div className="h-[4px] bg-surface2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: zone.couleur }} />
        </div>
      </div>

      {/* ── Staff ── */}
      <div className="flex items-center gap-1.5 px-4 mb-3 flex-wrap">
        {zone.postes.map(poste => {
          if (!poste.user) return null
          const { user } = poste
          return (
            <div key={poste.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[8px] border group"
              style={{ background: `${user.avatarColor}15`, borderColor: `${user.avatarColor}30` }}
            >
              <div className="w-5 h-5 rounded-[5px] flex items-center justify-center text-white font-extrabold text-[9px] flex-shrink-0"
                style={{ background: user.avatarColor }}>
                {getInitials(user.nom, user.prenom)}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: user.avatarColor }}>
                {getDisplayName(user.nom, user.prenom)}
              </span>
              {onRemoveStaff && (
                <button onClick={e => { e.stopPropagation(); onRemoveStaff(poste.id) }}
                  className="w-3.5 h-3.5 rounded-full bg-red/20 text-red flex items-center justify-center text-[8px]
                             font-extrabold leading-none opacity-0 group-hover:opacity-100 transition-opacity
                             duration-150 hover:bg-red/40 active:scale-90 ml-0.5"
                  title={`Retirer ${user.nom} de la zone`}>✕</button>
              )}
            </div>
          )
        })}
        {onAssign && (
          <button onClick={() => onAssign(zone)}
            className="flex items-center gap-1 px-2 py-1 rounded-[8px] border border-dashed border-border
                       text-[11px] font-semibold text-muted hover:text-text hover:border-border/80 transition-colors duration-150">
            <span className="text-[13px] font-bold leading-none">+</span> Assigner
          </button>
        )}
      </div>

      {/* ── Missions ── */}
      <div className="px-3 pb-3 flex flex-col gap-1">
        {onAddPonctuelle && (
          <button onClick={() => onAddPonctuelle(zone)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-dashed border-border
                       text-[11px] font-semibold text-muted hover:text-text hover:border-border/80
                       transition-colors duration-150 mb-1">
            <span className="text-[13px] font-bold">+</span> Ajouter une mission ponctuelle
          </button>
        )}

        {/* Liste dépliable */}
        <div className="relative">
          <motion.div
            animate={{ height: expanded || !hasMore ? 'auto' : COLLAPSED_H }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-1 overflow-hidden"
          >
            {zone.missions.map(mission => {
              // Résout le premier poste de la zone — la completion est attachée
              // à un poste, et tous les staff d'une zone partagent les missions.
              const firstPosteId = zone.postes[0]?.id ?? 0
              return (
                <MissionItem key={mission.id} mission={mission}
                  completed={!!completions[mission.id]}
                  loading={loadingMissions.has(mission.id)}
                  onToggle={(id, done) => onToggle(id, done, zone.id)}
                  onCapturePhoto={() => onCapturePhoto?.(mission, firstPosteId)}
                  onOpenPhoto={onOpenPhoto}
                />
              )
            })}
            {zone.missions.length === 0 && (
              <p className="text-[12px] text-muted text-center py-3">Aucune mission pour cette zone.</p>
            )}
          </motion.div>

          {/* Dégradé de coupure */}
          {!expanded && hasMore && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
          )}
        </div>

        {/* Toggle */}
        {hasMore && (
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center justify-center gap-1.5 w-full py-2 mt-0.5 rounded-[10px]
                       bg-surface2/60 border border-border/60 text-[11px] font-semibold text-muted
                       hover:text-text hover:bg-surface2 transition-all duration-150"
          >
            {expanded
              ? <><span className="text-[9px]">▲</span> Réduire</>
              : <><span className="text-[9px]">▼</span>{' '}
                  {zone.missions.length - PREVIEW_COUNT} mission{zone.missions.length - PREVIEW_COUNT > 1 ? 's' : ''} de plus
                </>
            }
          </button>
        )}
      </div>
    </div>
  )
}

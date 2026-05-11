'use client'

import { useState }                       from 'react'
import { AnimatePresence, motion }        from 'framer-motion'
import { cn }                             from '@/lib/cn'
import MissionItem                        from './MissionItem'
import { getInitials, getDisplayName }    from '@/lib/userDisplay'
import type { ServiceZoneData, ServiceZone, ServiceMission } from '@/types/service'

interface ZoneCardProps {
  zone:             ServiceZoneData
  completions:      Record<number, boolean>
  loadingMissions:  Set<number>
  onToggle:         (missionId: number, completed: boolean, zoneId: number) => void
  onAddPonctuelle?: (zone: ServiceZone) => void
  onAssign?:        (zone: ServiceZone) => void
  onRemoveStaff?:   (posteId: number) => void
  /** Ouvre la modal de capture photo pour une mission requiresPhoto. Le posteId est résolu depuis la zone. */
  onCapturePhoto?:  (mission: ServiceMission, posteId: number) => void
  /** Ouvre la lightbox plein écran sur la preuve photo d'une completion. */
  onOpenPhoto?:     (completionId: number) => void
  /** Décochage d'une mission requiresPhoto déjà validée — déclenche la confirmation côté parent. */
  onConfirmUncheck?: (mission: ServiceMission, zoneId: number) => void
}

export default function ZoneCard({
  zone, completions, loadingMissions, onToggle,
  onAddPonctuelle, onAssign, onRemoveStaff,
  onCapturePhoto, onOpenPhoto, onConfirmUncheck,
}: ZoneCardProps) {
  const totalMissions = zone.missions.length
  const doneMissions  = zone.missions.filter(m => completions[m.id]).length
  const pct           = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0
  // Par défaut : toutes les cards dépliées au mount (preserve l'usage actuel).
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: zone.couleur }} />
          <h3 className="font-syne font-extrabold text-[14px] uppercase tracking-wide truncate" style={{ color: zone.couleur }}>
            {zone.nom}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[13px] text-muted">{doneMissions}/{totalMissions}</span>
          <span className={cn(
            'text-[13px] font-extrabold px-2 py-0.5 rounded-[6px]',
            pct === 100 ? 'text-green bg-green/10' : pct >= 50 ? 'text-yellow bg-yellow/10' : 'text-muted bg-surface2'
          )}>{pct}%</span>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Replier la zone' : 'Déplier la zone'}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors"
          >
            <motion.span
              className="text-[11px] leading-none inline-block"
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </button>
        </div>
      </div>

      {/* ── Barre de progression (toujours visible) ── */}
      <div className="px-4 mb-3">
        <div className="h-[4px] bg-surface2 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: zone.couleur }} />
        </div>
      </div>

      {/* ── Staff (toujours visible) ── */}
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

      {/* ── Missions (collapsible) ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="missions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-1">
              {onAddPonctuelle && (
                <button onClick={() => onAddPonctuelle(zone)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-dashed border-border
                             text-[11px] font-semibold text-muted hover:text-text hover:border-border/80
                             transition-colors duration-150 mb-1">
                  <span className="text-[13px] font-bold">+</span> Ajouter une mission ponctuelle
                </button>
              )}

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
                    onConfirmUncheck={() => onConfirmUncheck?.(mission, zone.id)}
                  />
                )
              })}
              {zone.missions.length === 0 && (
                <p className="text-[12px] text-muted text-center py-3">Aucune mission pour cette zone.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

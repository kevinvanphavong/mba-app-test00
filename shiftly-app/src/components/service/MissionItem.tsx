'use client'

import { cn } from '@/lib/cn'
import { getInitials } from '@/lib/userDisplay'
import AuthImage from '@/components/shared/AuthImage'
import { useMissionCategories } from '@/hooks/useMissionCategories'
import type { ServiceMission } from '@/types/service'

interface MissionItemProps {
  mission:   ServiceMission
  completed: boolean
  loading?:  boolean
  onToggle:  (missionId: number, currentlyCompleted: boolean) => void
  /** Appelé quand l'user veut valider une mission requiresPhoto. Ouvre la modal capture côté parent. */
  onCapturePhoto?: (mission: ServiceMission) => void
  /** Callback pour ouvrir la lightbox plein écran d'une preuve photo. */
  onOpenPhoto?: (completionId: number) => void
  /** Appelé quand l'user veut DÉCOCHER une mission requiresPhoto déjà validée.
   *  Le parent affiche un modal de confirmation avant de réellement décocher. */
  onConfirmUncheck?: (mission: ServiceMission) => void
  /** Appelé quand l'user veut valider une mission HACCP (typeReleve = ...).
   *  Le parent ouvre HaccpCheckModal. */
  onHaccp?: (mission: ServiceMission) => void
}

const PRIORITE_CONFIG: Record<string, { dot: string; label: string }> = {
  vitale:         { dot: 'bg-red',    label: 'Vitale'    },
  important:      { dot: 'bg-yellow', label: 'Important' },
  ne_pas_oublier: { dot: 'bg-muted',  label: '–'         },
}

export default function MissionItem({
  mission,
  completed,
  loading = false,
  onToggle,
  onCapturePhoto,
  onOpenPhoto,
  onConfirmUncheck,
  onHaccp,
}: MissionItemProps) {
  const { data: categories = [] } = useMissionCategories()
  const cat = categories.find(c => c.nom === mission.categorie)

  const prio  = PRIORITE_CONFIG[mission.priorite] ?? PRIORITE_CONFIG['ne_pas_oublier']
  const initials = mission.completedBy
    ? getInitials(mission.completedBy.nom, mission.completedBy.prenom)
    : null

  // 3 branches :
  //  - requiresPhoto + !completed → modal capture (création de preuve)
  //  - requiresPhoto + completed  → modal confirmation décochage (évite perte accidentelle de la preuve)
  //  - sinon                       → toggle direct
  function handleClick() {
    if (loading) return
    // HACCP : ouvre le modal de saisie (pas de toggle direct)
    if (mission.haccpSpec && !completed) {
      onHaccp?.(mission)
      return
    }
    if (mission.requiresPhoto && !completed) {
      onCapturePhoto?.(mission)
      return
    }
    if (mission.requiresPhoto && completed) {
      onConfirmUncheck?.(mission)
      return
    }
    onToggle(mission.id, completed)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all duration-200',
        completed
          ? 'bg-green/5   border border-green/15'
          : 'bg-surface2 border border-transparent hover:border-border',
        loading && 'opacity-50 cursor-wait'
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-[18px] h-[18px] mt-[1px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all duration-200 border',
          completed
            ? 'bg-green border-green'
            : 'bg-surface border-border'
        )}
      >
        {completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Texte + labels */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-[13px] leading-snug transition-all duration-200 block',
            completed ? 'text-muted line-through' : 'text-text'
          )}
        >
          {mission.texte}
        </span>

        {/* Labels catégorie + priorité + fréquence */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {/* Catégorie — couleur dynamique depuis MissionCategorie (centre.config) */}
          {cat ? (
            <span
              className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border inline-flex items-center gap-1"
              style={{
                color:       cat.couleur,
                background:  `${cat.couleur}1a`,
                borderColor: `${cat.couleur}33`,
              }}
            >
              {cat.icone && <span>{cat.icone}</span>}
              {cat.nom}
            </span>
          ) : (
            // Fallback : slug texte sans correspondance dans le catalogue (catégorie supprimée).
            <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border border-border text-muted bg-surface2">
              {mission.categorie}
            </span>
          )}

          {/* Priorité — visible si vitale ou important */}
          {mission.priorite !== 'ne_pas_oublier' && (
            <span className="flex items-center gap-1">
              <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', prio.dot)} />
              <span className="text-[9px] font-bold text-muted uppercase tracking-wide">
                {prio.label}
              </span>
            </span>
          )}

          {/* Fréquence — visible pour les missions ponctuelles uniquement */}
          {mission.frequence === 'PONCTUELLE' && (
            <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border text-purple bg-purple/10 border-purple/20">
              Ponct.
            </span>
          )}

          {/* Badge preuve photo requise (visible tant que pas validée) */}
          {mission.requiresPhoto && !completed && (
            <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border text-accent bg-accent/10 border-accent/20 inline-flex items-center gap-0.5">
              📷 Photo
            </span>
          )}

          {/* Badge HACCP (visible tant que pas validée) */}
          {mission.haccpSpec && !completed && (
            <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border text-red bg-red/10 border-red/20 inline-flex items-center gap-0.5">
              🍔 HACCP {mission.haccpSpec.typeReleve === 'TEMPERATURE' ? 'T°' : mission.haccpSpec.typeReleve}
            </span>
          )}
        </div>
      </div>

      {/* Vignette photo de preuve (mission validée + photo dispo) */}
      {completed && mission.hasPhoto && mission.completionId !== null && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            if (mission.completionId !== null) onOpenPhoto?.(mission.completionId)
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && mission.completionId !== null) {
              e.preventDefault()
              e.stopPropagation()
              onOpenPhoto?.(mission.completionId)
            }
          }}
          className="w-[44px] h-[44px] tablet:w-[36px] tablet:h-[36px] rounded-[8px] overflow-hidden flex-shrink-0 border border-border bg-surface cursor-pointer"
          title="Voir la preuve photo (cliquer pour agrandir)"
        >
          <AuthImage
            src={`/completions/${mission.completionId}/photo`}
            alt="Preuve"
            className="w-full h-full object-cover"
          />
        </span>
      )}

      {/* Avatar completedBy */}
      {completed && initials && mission.completedBy && (
        <div
          title={mission.completedBy.nom}
          className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center text-white font-extrabold text-[8px] flex-shrink-0 mt-[1px]"
          style={{ background: mission.completedBy.avatarColor }}
        >
          {initials}
        </div>
      )}
    </button>
  )
}

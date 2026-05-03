'use client'

import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { capitalizeWords } from '@/lib/strings'
import ZoneTag from '@/components/ui/ZoneTag'
import TeamBubbles from '@/components/services/TeamBubbles'
import { TABLE_GRID_CLASS } from '@/components/services/ServicesTableHeader'
import type { ServiceListItem } from '@/types/index'
import type { TabKey } from '@/lib/serviceFilters'

interface ServicesTableRowProps {
  service:  ServiceListItem
  tab:      TabKey
  isOpen:   boolean
  isLast:   boolean
  onToggle: () => void
}

/** Chip de statut — couleurs alignées sur les 3 statuts BDD existants. */
function StatusChip({ statut }: { statut: ServiceListItem['statut'] }) {
  if (statut === 'EN_COURS') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.4px] px-2.5 py-1 rounded-[6px] bg-accent/12 text-accent border border-accent/25">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
        </span>
        En cours
      </span>
    )
  }
  if (statut === 'PLANIFIE') {
    return (
      <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4px] px-2.5 py-1 rounded-[6px] bg-blue/10 text-blue border border-blue/20">
        Planifié
      </span>
    )
  }
  return (
    <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4px] px-2.5 py-1 rounded-[6px] bg-green/10 text-green border border-green/20">
      Clôturé
    </span>
  )
}

/**
 * Ligne tableau /services. Cliquable pour déplier (chevron rotate).
 * - tab === 'historique' : affiche tâches/total en sous-ligne
 * - tab === 'encours'    : affiche mini-barre de progression
 */
export default function ServicesTableRow({ service, tab, isOpen, isLast, onToggle }: ServicesTableRowProps) {
  const dateLabel = capitalizeWords(format(parseISO(service.date), 'EEE d MMM', { locale: fr }))
  const horaires  = service.heureDebut && service.heureFin
    ? `${service.heureDebut} – ${service.heureFin}`
    : '—'

  return (
    <div
      onClick={onToggle}
      className={cn(
        TABLE_GRID_CLASS,
        'py-3.5 cursor-pointer transition-colors',
        isOpen ? 'bg-surface2' : 'hover:bg-surface2/50',
        !isLast || isOpen ? 'border-b border-border' : '',
      )}
    >
      {/* Chevron */}
      <div className="text-[11px] text-muted flex items-center justify-center">
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▸
        </span>
      </div>

      {/* Date + sous-ligne contextuelle */}
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-text">{dateLabel}</div>
        {tab === 'historique' && (
          <div className="text-[10px] text-muted mt-0.5">
            Tâches {service.tauxCompletion}%
          </div>
        )}
        {tab === 'encours' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-shrink-0 w-[90px] h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent2"
                style={{ width: `${service.tauxCompletion}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{service.tauxCompletion}%</span>
          </div>
        )}
      </div>

      {/* Horaires */}
      <div className="font-syne font-bold text-[11px] text-text/80">{horaires}</div>

      {/* Staff count */}
      <div className="text-[12px] font-semibold text-text">{service.staff.length}</div>

      {/* Équipe (avatars) */}
      <TeamBubbles members={service.staff} max={4} />

      {/* Zones — couleur depuis la BDD pour que les zones custom restent reconnaissables */}
      <div className="flex gap-1 flex-wrap">
        {service.zones.map(z => (
          <ZoneTag key={z.id} zone={z.nom} color={z.couleur} size="xs" />
        ))}
      </div>

      {/* Statut */}
      <div className="text-right">
        <StatusChip statut={service.statut} />
      </div>
    </div>
  )
}

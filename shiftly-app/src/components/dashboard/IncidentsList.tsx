import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import Panel from '@/components/ui/Panel'
import type { DashboardIncidents } from '@/types/dashboard'

interface IncidentsListProps {
  data:      DashboardIncidents
  onReport?: () => void
}

const SEV_DOT: Record<string, string> = {
  haute:   'bg-red',
  moyenne: 'bg-yellow',
  basse:   'bg-muted',
}
const SEV_LABEL: Record<string, string> = {
  haute:   'Haute',
  moyenne: 'Moyenne',
  basse:   'Basse',
}
const SEV_BADGE: Record<string, string> = {
  haute:   'text-red   bg-red/10',
  moyenne: 'text-yellow bg-yellow/10',
  basse:   'text-muted  bg-surface2',
}

/** Panel — liste des incidents ouverts avec sévérité et ancienneté */
export default function IncidentsList({ data, onReport }: IncidentsListProps) {
  const { alertes, total, haute, moyenne, basse } = data

  // Tous les incidents pour l'affichage (alertes = incidents haute sévérité open)
  // On construit une liste synthétique depuis les compteurs + alertes
  const incidents = [
    ...alertes,
    ...(moyenne > 0 ? [{
      id: -1, titre: `${moyenne} incident${moyenne > 1 ? 's' : ''} de sévérité moyenne`,
      severite: 'moyenne' as const, statut: 'OUVERT', service: null,
      createdAt: new Date().toISOString(),
    }] : []),
    ...(basse > 0 ? [{
      id: -2, titre: `${basse} incident${basse > 1 ? 's' : ''} de faible sévérité`,
      severite: 'basse' as const, statut: 'OUVERT', service: null,
      createdAt: new Date().toISOString(),
    }] : []),
  ]

  return (
    <Panel
      title="Incidents ouverts"
      action={{ label: 'Voir tous →' }}
    >
      {/* Compteur rapide */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-muted">{total} ouvert{total > 1 ? 's' : ''}</span>
        {haute > 0 && (
          <span className="text-[10px] font-extrabold text-red bg-red/10 px-1.5 py-0.5 rounded-[5px]">
            {haute} haute
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="flex items-center gap-2 py-3 text-[12px] text-muted">
          <span className="text-xl">✅</span>
          Aucun incident en cours
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {incidents.map((inc, i) => {
            const timeAgo = (() => {
              try {
                return formatDistanceToNow(new Date(inc.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })
              } catch {
                return ''
              }
            })()

            return (
              <div
                key={inc.id ?? i}
                className="flex items-start gap-2.5 p-2.5 bg-surface2 rounded-[12px] border border-border/50"
              >
                {/* Severity dot */}
                <span
                  className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    SEV_DOT[inc.severite] ?? 'bg-muted'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-text leading-snug truncate">
                    {inc.titre}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[4px]',
                        SEV_BADGE[inc.severite] ?? 'text-muted bg-surface2'
                      )}
                    >
                      {SEV_LABEL[inc.severite]}
                    </span>
                    {timeAgo && (
                      <span className="text-[10px] text-muted">{timeAgo}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {onReport && (
        <button
          onClick={onReport}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] border border-red/30 bg-red/5 text-red text-[12px] font-bold hover:bg-red/10 active:scale-[0.98] transition-all"
        >
          <span>⚠️</span>
          Signaler un incident
        </button>
      )}
    </Panel>
  )
}

'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import Panel from '@/components/ui/Panel'
import type { DashboardIncidents } from '@/types/dashboard'

interface IncidentsListProps {
  data: DashboardIncidents
}

const SEV_DOT: Record<string, string> = {
  haute:   'bg-red',
  moyenne: 'bg-yellow',
  basse:   'bg-muted',
}
const SEV_BADGE: Record<string, string> = {
  haute:   'text-red    bg-red/10',
  moyenne: 'text-yellow bg-yellow/10',
  basse:   'text-muted  bg-surface2',
}
const SEV_LABEL: Record<string, string> = {
  haute:   'Haute',
  moyenne: 'Moyenne',
  basse:   'Basse',
}

/** Panel — liste des incidents ouverts, tous affichés individuellement avec leur zone */
export default function IncidentsList({ data }: IncidentsListProps) {
  const { alertes, total, haute } = data

  return (
    <Panel title="Incidents ouverts">
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
          {alertes.map((inc, i) => {
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
                {/* Point de sévérité */}
                <span
                  className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    SEV_DOT[inc.severite] ?? 'bg-muted'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-text leading-snug">
                    {inc.titre}
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    {/* Badge sévérité */}
                    <span
                      className={cn(
                        'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-[4px]',
                        SEV_BADGE[inc.severite] ?? 'text-muted bg-surface2'
                      )}
                    >
                      {SEV_LABEL[inc.severite]}
                    </span>

                    {/* Zone rattachée */}
                    {inc.zone && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px]"
                        style={{
                          color:            inc.zone.couleur,
                          backgroundColor:  `${inc.zone.couleur}18`,
                        }}
                      >
                        {inc.zone.nom}
                      </span>
                    )}

                    {/* Ancienneté */}
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
    </Panel>
  )
}

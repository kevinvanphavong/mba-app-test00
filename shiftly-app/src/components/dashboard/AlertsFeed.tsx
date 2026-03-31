import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ty } from '@/lib/typography'
import Panel from '@/components/ui/Panel'
import type { DashboardAlerte } from '@/types/dashboard'

interface AlertsFeedProps {
  alertes: DashboardAlerte[]
}

const STATUT_LABEL: Record<string, string> = {
  OUVERT:   'Ouvert',
  EN_COURS: 'En cours',
  RESOLU:   'Résolu',
}
const STATUT_COLOR: Record<string, string> = {
  OUVERT:   'text-red   bg-red/10',
  EN_COURS: 'text-yellow bg-yellow/10',
  RESOLU:   'text-green  bg-green/10',
}

/**
 * Panel — alertes de sévérité haute avec point rouge clignotant.
 * Affiché uniquement si des alertes existent.
 */
export default function AlertsFeed({ alertes }: AlertsFeedProps) {
  return (
    <Panel title="Alertes">
      {alertes.length === 0 ? (
        <div className={`${ty.metaLg} flex items-center gap-2 py-3`}>
          <span className="text-xl">🟢</span>
          Aucune alerte active
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {alertes.map((alerte) => {
            const timeAgo = (() => {
              try {
                return formatDistanceToNow(new Date(alerte.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })
              } catch {
                return ''
              }
            })()

            return (
              <div
                key={alerte.id}
                className="relative flex items-start gap-3 p-3 bg-red/5 border border-red/20 rounded-[12px]"
              >
                {/* Pulsing alert dot */}
                <div className="flex-shrink-0 mt-0.5 relative w-3 h-3">
                  <span className="absolute inset-0 rounded-full bg-red animate-pulse_dot" />
                  <span className="absolute inset-0.5 rounded-full bg-red" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`${ty.body} font-semibold leading-snug`}>
                    {alerte.titre}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`${ty.badge} uppercase px-1.5 py-0.5 rounded-[4px] ${
                        STATUT_COLOR[alerte.statut] ?? 'text-muted bg-surface2'
                      }`}
                    >
                      {STATUT_LABEL[alerte.statut] ?? alerte.statut}
                    </span>
                    {timeAgo && (
                      <span className={ty.metaSm}>{timeAgo}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Summary badge */}
          <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-border">
            <span className={ty.metaSm}>
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''} haute sévérité
            </span>
            <button className={`${ty.metaSm} text-accent font-semibold hover:opacity-75 transition-opacity`}>
              Gérer →
            </button>
          </div>
        </div>
      )}
    </Panel>
  )
}

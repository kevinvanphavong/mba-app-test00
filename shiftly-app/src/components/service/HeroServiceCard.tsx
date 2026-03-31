import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { ServicePageData } from '@/types/service'

interface HeroServiceCardProps {
  service:            ServicePageData['service']
  globalPct:          number
  zonePcts:           Array<{ nom: string; couleur: string; pct: number }>
  onReportIncident?:  () => void
}

const STATUT_CONFIG = {
  EN_COURS: { label: 'En cours', dot: true,  cls: 'text-accent bg-accent/10' },
  PLANIFIE: { label: 'Planifié', dot: false, cls: 'text-blue   bg-blue/10'   },
  TERMINE:  { label: 'Terminé',  dot: false, cls: 'text-muted  bg-surface2'   },
} as const

export default function HeroServiceCard({
  service,
  globalPct,
  zonePcts,
  onReportIncident,
}: HeroServiceCardProps) {
  const cfg = STATUT_CONFIG[service.statut] ?? STATUT_CONFIG.PLANIFIE

  const dateLabel = new Date(service.date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="relative bg-surface border border-border rounded-[18px] p-4 overflow-hidden accent-bar">
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className={ty.cardTitleLg}>
              {service.centreName}
            </div>
            <div className={`${ty.metaLg} mt-0.5 capitalize`}>{dateLabel}</div>
          </div>

          {/* Droite : badge statut + bouton incident */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onReportIncident && (
              <button
                onClick={onReportIncident}
                className={`${ty.meta} font-extrabold font-syne flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-red/10 text-red border border-red/20 hover:bg-red/20 transition-colors`}
              >
                ⚠ Incident
              </button>
            )}
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-[8px]',
              cfg.cls
            )}>
              {cfg.dot && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse_dot" />
              )}
              <span className={`${ty.meta} font-extrabold font-syne`}>{cfg.label}</span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className={`${ty.kpi} text-[26px] mb-3`}>
          {service.heureDebut}
          <span className="text-muted font-normal text-[16px] mx-2">→</span>
          {service.heureFin}
        </div>

        {/* ── Global progress ── */}
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className={ty.meta}>Avancement global</span>
            <span className={`${ty.meta} font-extrabold text-accent font-syne`}>{globalPct}%</span>
          </div>
          <div className="h-[7px] bg-surface2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-700"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </div>

        {/* ── Zone mini-bars ── */}
        {zonePcts.length > 0 && (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${zonePcts.length}, 1fr)` }}
          >
            {zonePcts.map(z => (
              <div key={z.nom} className="bg-surface2/80 rounded-[10px] p-2.5">
                <div
                  className={`${ty.badgeMd} font-extrabold font-syne mb-1.5`}
                  style={{ color: z.couleur }}
                >
                  {z.nom}
                </div>
                <div className="h-[4px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${z.pct}%`, background: z.couleur }}
                  />
                </div>
                <div className={`${ty.metaSm} mt-1.5 font-syne font-bold`}>
                  {z.pct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

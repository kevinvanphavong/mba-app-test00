import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { ServicePageData } from '@/types/service'
import ServiceNoteSection      from '@/components/service/ServiceNoteSection'

interface HeroServiceCardProps {
  service:    ServicePageData['service']
  globalPct:  number
  stats:      Array<{ nom: string; couleur: string; done: number; total: number }>
  totalDone:  number
  totalAll:   number
  isManager:  boolean
}

const STATUT_CONFIG = {
  EN_COURS: { label: 'En cours', dot: true,  cls: 'text-accent bg-accent/10' },
  PLANIFIE: { label: 'Planifié', dot: false, cls: 'text-blue   bg-blue/10'   },
  TERMINE:  { label: 'Terminé',  dot: false, cls: 'text-muted  bg-surface2'   },
} as const

export default function HeroServiceCard({
  service,
  globalPct,
  stats,
  totalDone,
  totalAll,
  isManager,
}: HeroServiceCardProps) {
  const cfg = STATUT_CONFIG[service.statut] ?? STATUT_CONFIG.PLANIFIE

  const dateLabel    = new Date(service.date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const realToday    = new Date().toISOString().split('T')[0]
  const isNightShift = service.date !== realToday

  return (
    <div className="relative bg-surface border border-border rounded-[18px] p-4 overflow-hidden accent-bar">
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-4">

        {/* ── Section 1 : Identité du service ── */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={ty.cardTitleLg}>
                {service.centreName}
              </div>
              <div className={`${ty.metaLg} mt-0.5 capitalize`}>{dateLabel}</div>
            </div>

            {/* Badges + actions à droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isNightShift && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface2 border border-border text-muted">
                  Nuit
                </span>
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

          {/* Horaires */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={ty.meta}>Horaires</span>
            <div className={`${ty.kpi} text-[22px] leading-none`}>
              {service.heureDebut}
              <span className="text-muted font-normal text-[14px] mx-1.5">→</span>
              {service.heureFin}
            </div>
          </div>
        </div>

        {/* ── Section 2 : Avancement ── */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className={ty.meta}>Avancement global</span>
            <span className="font-syne font-extrabold text-[20px] text-accent leading-none">
              {globalPct}%
            </span>
          </div>

          {/* Barre principale */}
          <div className="h-2 bg-surface2 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700"
              style={{ width: `${globalPct}%` }}
            />
          </div>

          {/* Détail par zone */}
          <div className="flex flex-col gap-2.5">
            {stats.map(z => {
              const pct = z.total > 0 ? Math.round((z.done / z.total) * 100) : 0
              return (
                <div key={z.nom} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-[80px] flex-shrink-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: z.couleur }} />
                    <span className="text-[11px] font-syne font-bold truncate" style={{ color: z.couleur }}>{z.nom}</span>
                  </div>
                  <div className="flex-1 h-[5px] bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: z.couleur }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 min-w-[60px] justify-end">
                    <span className="text-[12px] font-extrabold font-syne" style={{ color: z.couleur }}>{pct}%</span>
                    <span className="text-[12px] text-muted">{z.done}/{z.total}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total missions */}
          <div className="flex items-center justify-between mt-3">
            <span className={ty.meta}>Missions complétées</span>
            <span className="text-[13px] font-extrabold font-syne text-text">
              {totalDone}<span className="text-muted font-normal">/{totalAll}</span>
            </span>
          </div>
        </div>

        {/* ── Section 3 : Note du service ── */}
        {(service.note || isManager) && (
          <div className="pt-3 border-t border-border">
            <ServiceNoteSection
              serviceId={service.id}
              note={service.note}
              isManager={isManager}
            />
          </div>
        )}

      </div>
    </div>
  )
}

import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { DashboardService } from '@/types/dashboard'

interface HeroServiceProps {
  data:               DashboardService
  onReportIncident?:  () => void
}

const RADIUS = 38
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const STATUT_LABEL: Record<string, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE:  'Terminé',
}
const STATUT_COLOR: Record<string, string> = {
  PLANIFIE: 'text-blue   bg-blue/10',
  EN_COURS: 'text-green  bg-green/10',
  TERMINE:  'text-muted  bg-surface2',
}

/** Hero card — service du jour + jauge circulaire d'occupation */
export default function HeroService({ data, onReportIncident }: HeroServiceProps) {
  const { today, tauxCompletion } = data

  if (!today) {
    return (
      <div className="relative bg-surface border border-border rounded-[18px] p-5 overflow-hidden accent-bar">
        <p className={`${ty.bodyLg} text-muted`}>Aucun service planifié aujourd&apos;hui.</p>
      </div>
    )
  }

  const pct        = Math.max(0, Math.min(100, tauxCompletion))
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100)

  return (
    <div className="relative bg-surface border border-border rounded-[18px] p-5 overflow-hidden accent-bar">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        {/* ── Left: service info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={cn(
                `${ty.badgeMd} font-syne uppercase tracking-wider px-2 py-0.5 rounded-[6px]`,
                STATUT_COLOR[today.statut] ?? 'text-muted bg-surface2'
              )}
            >
              {STATUT_LABEL[today.statut] ?? today.statut}
            </span>
            <span className={ty.meta}>Service du jour</span>
            {onReportIncident && (
              <button
                onClick={onReportIncident}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-red/10 text-red border border-red/20 text-[10px] font-extrabold font-syne hover:bg-red/20 transition-colors"
              >
                ⚠ Incident
              </button>
            )}
          </div>

          {today.heureDebut && today.heureFin ? (
            <div className={`${ty.kpi} lg:text-[34px] mb-1`}>
              {today.heureDebut}
              <span className="text-muted font-normal text-[16px] mx-1.5">→</span>
              {today.heureFin}
            </div>
          ) : (
            <p className={`${ty.metaLg} mb-1 text-muted italic`}>Horaires non définis</p>
          )}

          <p className={`${ty.metaLg} mt-2`}>
            {today.nbPostes} poste{today.nbPostes !== 1 ? 's' : ''} · {new Date(today.date).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>

          {/* Linear progress fallback (mobile-friendly) */}
          <div className="mt-4 hidden sm:block lg:hidden">
            <div className="flex justify-between mb-1.5">
              <span className={ty.meta}>Avancement missions</span>
              <span className="text-accent font-bold">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Right: circular progress ── */}
        <div className="relative flex-shrink-0 w-[96px] h-[96px]">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full -rotate-90"
            aria-label={`${pct.toFixed(0)}% d'avancement`}
          >
            {/* Track */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="#252a3a"
              strokeWidth="7"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#f97316" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={ty.kpiMd}>
              {pct.toFixed(0)}%
            </span>
            <span className={`${ty.badge} text-muted mt-0.5 uppercase tracking-wide`}>missions</span>
          </div>
        </div>
      </div>
    </div>
  )
}

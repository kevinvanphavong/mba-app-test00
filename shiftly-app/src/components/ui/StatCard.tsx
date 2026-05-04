import { cva } from 'class-variance-authority'
import { cn }   from '@/lib/cn'
import { ty }   from '@/lib/typography'

// ─── Variants CVA ─────────────────────────────────────────────────────────────
const trendBadge = cva(
  'absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-[6px] ty-meta',
  {
    variants: {
      direction: {
        up:   'bg-green/10 text-green',
        down: 'bg-red/10   text-red',
      },
    },
  }
)

// ─── Props ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon:       string
  value:      string | number
  label:      string
  /** Badge directionnel (up/down vert/rouge). Mutuellement exclusif avec `tag`. */
  trend?:     { value: string; up?: boolean }
  /** Tag contextuel neutre affiché en coin sup. droit (ex: « En cours », « À traiter »). */
  tag?:       string
  className?: string
}

// ─── Composant ───────────────────────────────────────────────────────────────
export default function StatCard({ icon, value, label, trend, tag, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-surface border border-border rounded-2xl p-4 relative',
      className
    )}>
      {trend && (
        <span className={trendBadge({ direction: trend.up ? 'up' : 'down' })}>
          {trend.value}
        </span>
      )}
      {!trend && tag && (
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[6px] bg-surface2 text-muted ty-meta">
          {tag}
        </span>
      )}
      <div className="text-xl mb-2">{icon}</div>
      <div className={ty.kpi}>{value}</div>
      <div className={`${ty.metaLg} mt-1`}>{label}</div>
    </div>
  )
}

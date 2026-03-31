import { cva } from 'class-variance-authority'
import { cn }   from '@/lib/cn'
import { ty }   from '@/lib/typography'

// ─── Variants CVA ─────────────────────────────────────────────────────────────
const trendBadge = cva(
  'absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-[6px]',
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
  trend?:     { value: string; up?: boolean }
  className?: string
}

// ─── Composant ───────────────────────────────────────────────────────────────
export default function StatCard({ icon, value, label, trend, className }: StatCardProps) {
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
      <div className="text-xl mb-2">{icon}</div>
      <div className={ty.kpi}>{value}</div>
      <div className={`${ty.metaLg} mt-1`}>{label}</div>
    </div>
  )
}

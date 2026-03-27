import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// ─── Variants CVA ─────────────────────────────────────────────────────────────
const zoneTag = cva(
  // Base — classes communes à toutes les variantes
  'inline-flex items-center font-bold rounded-[6px] border',
  {
    variants: {
      zone: {
        Accueil: 'bg-blue/10   text-blue   border-blue/20',
        Bar:     'bg-purple/10 text-purple border-purple/20',
        Salle:   'bg-green/10  text-green  border-green/20',
        Manager: 'bg-accent/10 text-accent border-accent/20',
        default: 'bg-surface2  text-muted  border-border',
      },
      size: {
        sm: 'text-[10px] px-2   py-0.5',
        xs: 'text-[9px]  px-1.5 py-0.5',
      },
    },
    defaultVariants: {
      zone:  'default',
      size:  'sm',
    },
  }
)

// ─── Props ────────────────────────────────────────────────────────────────────
type ZoneKey = 'Accueil' | 'Bar' | 'Salle' | 'Manager'

interface ZoneTagProps {
  zone:       string
  size?:      'sm' | 'xs'
  className?: string
}

// ─── Composant ───────────────────────────────────────────────────────────────
export default function ZoneTag({ zone, size, className }: ZoneTagProps) {
  return (
    <span className={cn(zoneTag({ zone: zone as ZoneKey, size }), className)}>
      {zone}
    </span>
  )
}

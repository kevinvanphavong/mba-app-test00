import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { hexAlpha } from '@/lib/colors'

// ─── Variants CVA ─────────────────────────────────────────────────────────────
// Utilisé uniquement quand aucune couleur n'est passée en prop : compat avec
// les zones historiques (Accueil/Bar/Salle/Manager). Pour toute zone créée
// par un manager, on passe `color` (hex BDD) → style dynamique.
const zoneTag = cva(
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
      zone: 'default',
      size: 'sm',
    },
  }
)

const sizeClass = {
  sm: 'text-[10px] px-2 py-0.5',
  xs: 'text-[9px] px-1.5 py-0.5',
}

// ─── Props ────────────────────────────────────────────────────────────────────
type ZoneKey = 'Accueil' | 'Bar' | 'Salle' | 'Manager'

interface ZoneTagProps {
  zone:       string
  /** Couleur hex de la zone (depuis la BDD). Si fournie, override les variants CVA
   *  → garantit que les zones créées par le manager s'affichent dans leur couleur. */
  color?:     string
  size?:      'sm' | 'xs'
  className?: string
}

// ─── Composant ───────────────────────────────────────────────────────────────
export default function ZoneTag({ zone, color, size = 'sm', className }: ZoneTagProps) {
  // Style dynamique depuis la couleur BDD : prioritaire sur les variants CVA
  if (color) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-bold rounded-[6px] border',
          sizeClass[size],
          className,
        )}
        style={{
          backgroundColor: hexAlpha(color, 0.10),
          color,
          borderColor: hexAlpha(color, 0.30),
        }}
      >
        {zone}
      </span>
    )
  }

  // Fallback : variants CVA (préserve les usages existants sans couleur)
  return (
    <span className={cn(zoneTag({ zone: zone as ZoneKey, size }), className)}>
      {zone}
    </span>
  )
}

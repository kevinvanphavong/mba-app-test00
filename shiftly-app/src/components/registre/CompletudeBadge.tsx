'use client'

import type { CompletudeRegistre } from '@/types/staff'

interface Props {
  completude: CompletudeRegistre | null
  className?: string
}

/**
 * Pastille de complétude du Registre Unique du Personnel (E1).
 * Vert si complet, sinon ambre avec le ratio rempli/total.
 */
export default function CompletudeBadge({ completude, className = '' }: Props) {
  if (!completude) return null

  const { score, total, complet } = completude
  const label = complet ? '✓ RUP complet' : `${score}/${total} RUP`

  return (
    <span
      title={complet ? 'Fiche conforme au Registre Unique du Personnel' : `${total - score} information(s) manquante(s) au RUP`}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
        complet
          ? 'bg-green/15 text-green border-green/30'
          : 'bg-yellow/15 text-yellow border-yellow/30'
      } ${className}`}
    >
      {label}
    </span>
  )
}

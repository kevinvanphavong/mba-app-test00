'use client'

import type { DevisLigne } from '@/features/b2b/types'
import { euros } from '@/features/b2b/format'

/**
 * Une ligne de devis éditable. Le montant affiché est un APERÇU client (qté × PU) ;
 * le montant/total réels sont recalculés côté serveur à l'enregistrement.
 */
export default function DevisLigneRow({
  ligne,
  onChange,
  onRemove,
}: {
  ligne: DevisLigne
  onChange: (l: DevisLigne) => void
  onRemove: () => void
}) {
  const apercu = ligne.quantite * ligne.prixUnitaireCents

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={ligne.designation}
        onChange={(e) => onChange({ ...ligne, designation: e.target.value })}
        placeholder="Désignation"
        className="min-w-0 flex-1 rounded-input border border-border bg-surface2 px-2 py-1 text-sm text-text outline-none focus:border-accent"
      />
      <input
        type="number"
        min={1}
        value={ligne.quantite}
        onChange={(e) => onChange({ ...ligne, quantite: Math.max(1, Number(e.target.value) || 1) })}
        className="w-16 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent"
        aria-label="Quantité"
      />
      <input
        type="number"
        min={0}
        value={ligne.prixUnitaireCents / 100}
        onChange={(e) => onChange({ ...ligne, prixUnitaireCents: Math.max(0, Math.round((Number(e.target.value) || 0) * 100)) })}
        className="w-24 rounded-input border border-border bg-surface2 px-2 py-1 text-right text-sm text-text outline-none focus:border-accent"
        aria-label="Prix unitaire (€)"
      />
      <span className="w-24 text-right text-sm text-text-soft">{euros(apercu)}</span>
      <button onClick={onRemove} className="text-muted hover:text-red" aria-label="Supprimer la ligne">
        ✕
      </button>
    </div>
  )
}

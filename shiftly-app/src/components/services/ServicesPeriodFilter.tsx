'use client'

import { getPeriodShortcut } from '@/lib/serviceFilters'

interface ServicesPeriodFilterProps {
  /** Aujourd'hui (YYYY-MM-DD) — utilisé pour les raccourcis ±N jours */
  today:        string
  dateFrom:     string
  dateTo:       string
  onFromChange: (d: string) => void
  onToChange:   (d: string) => void
  onShortcut:   (kind: '7j' | '30j' | 'tout') => void
  /** Compteur de résultats (après filtrage onglet + période) */
  resultCount:  number
}

/**
 * Filtre période : 2 inputs date + bouton reset + raccourcis 7J/30J/Tout.
 * Le compteur résultats vit à droite (`ml-auto`).
 */
export default function ServicesPeriodFilter({
  today, dateFrom, dateTo, onFromChange, onToChange, onShortcut, resultCount,
}: ServicesPeriodFilterProps) {
  const hasFilter = Boolean(dateFrom || dateTo)

  // Wrapper pour exposer la valeur sans réimporter getPeriodShortcut côté parent
  void today; void getPeriodShortcut

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Inputs date */}
      <div className="flex items-center gap-1.5 bg-surface border border-border rounded-[10px] px-2.5 py-1">
        <span className="text-[10px] font-syne font-bold uppercase tracking-wide text-muted mr-1">Période</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onFromChange(e.target.value)}
          className="bg-surface2 border border-border rounded-[7px] px-2 py-1 text-[11px] text-text outline-none [color-scheme:dark]"
        />
        <span className="text-[11px] text-muted">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => onToChange(e.target.value)}
          className="bg-surface2 border border-border rounded-[7px] px-2 py-1 text-[11px] text-text outline-none [color-scheme:dark]"
        />
        {hasFilter && (
          <button
            onClick={() => { onFromChange(''); onToChange('') }}
            title="Effacer le filtre"
            className="text-muted hover:text-text text-[14px] leading-none px-1"
          >
            ×
          </button>
        )}
      </div>

      {/* Raccourcis */}
      <div className="flex gap-1">
        {(['7j', '30j', 'tout'] as const).map(kind => (
          <button
            key={kind}
            onClick={() => onShortcut(kind)}
            className="px-2.5 py-1.5 rounded-[7px] border border-border bg-surface text-muted hover:text-text hover:border-accent/40 font-syne text-[10px] font-bold uppercase tracking-[0.6px] transition-colors"
          >
            {kind === 'tout' ? 'Tout' : kind === '7j' ? '7J' : '30J'}
          </button>
        ))}
      </div>

      <span className="ml-auto text-[11px] text-muted">
        {resultCount} résultat{resultCount > 1 ? 's' : ''}
      </span>
    </div>
  )
}

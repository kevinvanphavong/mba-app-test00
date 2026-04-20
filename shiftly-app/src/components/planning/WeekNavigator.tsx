'use client'

interface WeekNavigatorProps {
  weekStart:  string
  weekEnd:    string
  weekNumber: number
  onPrev:     () => void
  onNext:     () => void
  onToday:    () => void
}

const MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

function fmt(d: string) {
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

/** Barre de navigation semaine — centrée, sans actions (celles-ci sont dans le header) */
export default function WeekNavigator({ weekStart, weekEnd, weekNumber, onPrev, onNext, onToday }: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 md:px-6 md:py-3">
      {/* Placeholder gauche pour équilibrage */}
      <div className="w-20" />

      {/* Navigation centrée */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          aria-label="Semaine précédente"
        >←</button>

        <div className="text-center">
          <p className="font-syne text-[13px] font-bold text-[var(--text)] md:text-[15px]">Semaine {weekNumber}</p>
          <p className="text-[11px] text-[var(--muted)] md:text-[13px]">{fmt(weekStart)} — {fmt(weekEnd)}</p>
        </div>

        <button
          onClick={onNext}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          aria-label="Semaine suivante"
        >→</button>
      </div>

      {/* Bouton Aujourd'hui */}
      <button
        onClick={onToday}
        className="rounded-lg border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.08)] px-4 py-2.5 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:bg-[rgba(249,115,22,0.15)]"
      >
        Aujourd'hui
      </button>
    </div>
  )
}

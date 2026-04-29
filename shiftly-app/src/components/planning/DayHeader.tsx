'use client'

interface DayHeaderProps {
  date:    string   // 'YYYY-MM-DD'
  isToday: boolean
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** En-tête colonne jour dans la grille planning */
export default function DayHeader({ date, isToday }: DayHeaderProps) {
  const d       = new Date(date + 'T12:00:00')
  const dayName = JOURS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const dayNum  = d.getDate()

  return (
    <div
      className={`flex items-baseline justify-center gap-1.5 py-2 ${
        isToday ? 'bg-[rgba(249,115,22,0.06)]' : ''
      }`}
    >
      <span className={`text-[10px] font-semibold uppercase tracking-widest ${
        isToday ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
      }`}>
        {dayName}
      </span>
      <span className={`font-syne text-[15px] font-bold leading-none ${
        isToday ? 'text-[var(--accent)]' : 'text-[var(--text)]'
      }`}>
        {dayNum}
      </span>
    </div>
  )
}

'use client'

type Props = {
  value:       string
  onChange:    (v: string) => void
  /** Nombre de rubriques visibles, affiché seulement quand une recherche est active. */
  count:       number | null
  placeholder: string
}

/** Champ de recherche de l'aide + compteur de résultats. */
export default function AideSearch({ value, onChange, count, placeholder }: Props) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] opacity-50" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Chercher dans l'aide"
          className="w-full rounded-input border border-border bg-surface py-2.5 pl-9 pr-3.5 text-[13px] text-text outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
      </div>
      {count !== null && (
        <span className="whitespace-nowrap text-[12px] text-muted">
          {count} rubrique{count > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

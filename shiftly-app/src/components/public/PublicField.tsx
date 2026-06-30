'use client'

/** Champ labellisé réutilisable (input contrôlé) pour les formulaires publics. */
export default function PublicField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-sm font-medium text-text-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-input border border-border bg-surface2 px-3 py-2.5 font-sans text-text outline-none transition-colors placeholder:text-muted focus:border-accent"
      />
    </label>
  )
}

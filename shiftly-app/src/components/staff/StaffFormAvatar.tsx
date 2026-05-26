'use client'

/**
 * Carte « Avatar » du formulaire membre — preview + palette 6 colonnes.
 * Présentationnel : pas de logique métier, le parent gère l'état `avatarColor`.
 */

import { AVATAR_PALETTE, getGradientFromColor } from '@/lib/colors'
import { StaffFormCard } from './StaffFormCard'

interface Props {
  /** Couleur courante (hex) */
  value:    string
  /** Texte des initiales affichées en preview (≤ 2 caractères) */
  initials: string
  onChange: (color: string) => void
}

export default function StaffFormAvatar({ value, initials, onChange }: Props) {
  const gradient = getGradientFromColor(value)
  const label    = AVATAR_PALETTE.find(p => p.color === value)?.label ?? 'Personnalisée'

  return (
    <StaffFormCard ico="◆" title="Avatar">
      <div className="flex items-center gap-3">
        <div className="p-[2.5px] rounded-[12px]" style={{ background: value }}>
          <div
            className="w-[46px] h-[46px] rounded-[10px] flex items-center justify-center text-white font-extrabold text-[14px]"
            style={{ background: gradient }}
          >
            {initials || '?'}
          </div>
        </div>
        <p className="text-[12px] text-muted">{label}</p>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {AVATAR_PALETTE.map(entry => (
          <button
            key={entry.color}
            type="button"
            onClick={() => onChange(entry.color)}
            title={entry.label}
            aria-label={entry.label}
            aria-pressed={value === entry.color}
            className="relative aspect-square rounded-[9px] transition-transform active:scale-90"
            style={{ background: entry.gradient }}
          >
            {value === entry.color && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </StaffFormCard>
  )
}

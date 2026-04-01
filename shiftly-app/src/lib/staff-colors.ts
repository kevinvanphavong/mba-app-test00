/**
 * Gradient unique par userId — utilisé pour les avatars du staff.
 * Chaque gradient est défini une seule fois ici et importé partout.
 */

export const STAFF_GRADIENTS: Record<number, string> = {
  1:  'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',  // Kévin   — orange
  2:  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',  // Patou   — blue
  3:  'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',  // Aya     — purple
  4:  'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',  // Gabin   — green
  5:  'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',  // Erwan   — teal
  6:  'linear-gradient(135deg, #f472b6 0%, #f9a8d4 100%)',  // Hiba    — pink
  7:  'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',  // Dina    — amber
  8:  'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',  // Cynthia — cyan
  9:  'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',  // Lucas   — indigo
  10: 'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)',  // Théo    — lime
  11: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',  // Amina   — red
  12: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',  // Yanis   — violet
}

/** Retourne le gradient d'un userId (fallback = orange accent) */
export function getStaffGradient(userId: number): string {
  return STAFF_GRADIENTS[userId] ?? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
}

/** Couleur "de base" extraite du gradient (premier stop) — pour les badges */
export const STAFF_COLORS: Record<number, string> = {
  1:  '#f97316',
  2:  '#3b82f6',
  3:  '#a855f7',
  4:  '#22c55e',
  5:  '#14b8a6',
  6:  '#f472b6',
  7:  '#f59e0b',
  8:  '#06b6d4',
  9:  '#6366f1',
  10: '#84cc16',
  11: '#ef4444',
  12: '#8b5cf6',
}

export function getStaffColor(userId: number): string {
  return STAFF_COLORS[userId] ?? '#f97316'
}

// ─── Palette avatar (sélectable dans le modal d'édition) ─────────────────────

export interface AvatarPaletteEntry {
  color:    string
  gradient: string
  label:    string
}

export const AVATAR_PALETTE: AvatarPaletteEntry[] = [
  { color: '#f97316', gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', label: 'Orange' },
  { color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', label: 'Bleu'   },
  { color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)', label: 'Violet' },
  { color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)', label: 'Vert'   },
  { color: '#14b8a6', gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', label: 'Teal'   },
  { color: '#f472b6', gradient: 'linear-gradient(135deg, #f472b6 0%, #f9a8d4 100%)', label: 'Rose'   },
  { color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', label: 'Ambre'  },
  { color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', label: 'Cyan'   },
  { color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', label: 'Indigo' },
  { color: '#84cc16', gradient: 'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)', label: 'Lime'   },
  { color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', label: 'Rouge'  },
  { color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', label: 'Mauve'  },
]

/** Retourne le gradient associé à une couleur de la palette (fallback = couleur solide) */
export function getGradientFromColor(color: string): string {
  return AVATAR_PALETTE.find(p => p.color === color)?.gradient
    ?? `linear-gradient(135deg, ${color} 0%, ${color} 100%)`
}

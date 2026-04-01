/**
 * colors.ts — Source unique de vérité pour toutes les couleurs dynamiques.
 *
 * Les couleurs statiques (utilisées dans les classes Tailwind) restent dans tailwind.config.ts.
 * Ce fichier gère uniquement les couleurs utilisées via style={} à l'exécution (runtime).
 *
 * Règle de sécurité : toutes les valeurs retournées par ce fichier sont validées.
 * Les entrées inconnues reçoivent un fallback neutre (#6b7280) plutôt qu'une chaîne vide.
 */

import type { ZoneNom } from '@/types/staff'

// ─── Couleurs de zones ────────────────────────────────────────────────────────
// IMPORTANT : ces valeurs hex doivent rester synchronisées avec les tokens
// `zone.*` définis dans tailwind.config.ts.

export const ZONE_COLORS: Record<ZoneNom, string> = {
  Accueil: '#3b82f6',
  Bar:     '#a855f7',
  Salle:   '#22c55e',
  Manager: '#f97316',
}

/** Retourne la couleur hex d'une zone — fallback neutre si inconnue. */
export function getZoneColor(zone: string): string {
  return (ZONE_COLORS as Record<string, string>)[zone] ?? '#6b7280'
}

// ─── Opacité hexadécimale ─────────────────────────────────────────────────────
/**
 * Applique une opacité alpha à une couleur hex en ajoutant deux chiffres hex.
 *
 * Remplace le pattern fragile `${color}18` / `${color}35`.
 * @example hexAlpha('#3b82f6', 0.1)  → '#3b82f61a'
 * @example hexAlpha('#3b82f6', 0.21) → '#3b82f635'
 */
export function hexAlpha(hex: string, alpha: number): string {
  // Sécurité : on ne manipule que les couleurs hex valides (#rrggbb)
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
  return hex + a.toString(16).padStart(2, '0')
}

// ─── Couleurs staff (ré-export depuis staff-colors.ts) ───────────────────────
// Point d'entrée unifié : importer depuis '@/lib/colors' couvre tous les besoins.
export {
  STAFF_GRADIENTS,
  STAFF_COLORS,
  getStaffGradient,
  getStaffColor,
  AVATAR_PALETTE,
  getGradientFromColor,
} from './staff-colors'
export type { AvatarPaletteEntry } from './staff-colors'

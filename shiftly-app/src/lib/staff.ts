/**
 * Helpers du module Staff — fonctions pures, testables et réutilisables.
 */

export type NiveauPalier = 1 | 2 | 3 | 4

export interface Niveau {
  palier: NiveauPalier
  label:  string
}

/**
 * Calcule le palier de niveau d'un membre à partir de son ratio de compétences acquises.
 *
 *   < 30%       → 1 — Débutant
 *   30 → 60%    → 2 — Intermédiaire
 *   60 → 90%    → 3 — Confirmé
 *   ≥ 90%       → 4 — Avancé
 *
 * Si le centre n'a aucune compétence configurée (total=0), on retourne Débutant
 * par défaut (impossible de calculer un ratio).
 */
export function calculerNiveau(acquises: number, total: number): Niveau {
  if (total <= 0) return { palier: 1, label: 'Débutant' }
  const ratio = acquises / total
  if (ratio >= 0.9) return { palier: 4, label: 'Avancé'       }
  if (ratio >= 0.6) return { palier: 3, label: 'Confirmé'     }
  if (ratio >= 0.3) return { palier: 2, label: 'Intermédiaire'}
  return                 { palier: 1, label: 'Débutant'      }
}

/**
 * Formatte l'ancienneté à partir de la date d'embauche.
 *
 *   ≥ 12 mois → "X ans"
 *   < 12 mois → "X mois"
 *   null      → null (la ligne sera masquée côté UI)
 *
 * Tolère les ISO complets ("2024-01-15") comme les dates avec heure.
 */
export function calculerAnciennete(dateEmbauche: string | null): string | null {
  if (!dateEmbauche) return null

  const debut = new Date(dateEmbauche)
  if (Number.isNaN(debut.getTime())) return null

  const now    = new Date()
  const months = (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth())

  if (months < 1)  return 'Moins d\'un mois'
  if (months < 12) return `${months} mois`

  const years = Math.floor(months / 12)
  return `${years} an${years > 1 ? 's' : ''}`
}

/** Initiales 2 lettres à partir du membre (prénom + nom). */
export function staffInitials(prenom: string | null, nom: string): string {
  const a = (prenom?.[0] ?? nom[0] ?? '?')
  const b = (nom.split(' ')[0]?.[0] ?? '')
  return (a + b).toUpperCase()
}

/** Cible "100%" sur la barre points (cohérent avec la maquette). */
export const POINTS_BAR_TARGET = 300


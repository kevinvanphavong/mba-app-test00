/**
 * Types du centre d'aide (`/aide`).
 *
 * Contenu 100 % statique et typé : aucune entité, aucune table, aucun appel API.
 * La source de vérité du texte est `aide.html` (maquette validée) ; la donnée
 * vit dans `src/lib/aideContent.ts`.
 */

// Rôle d'affichage du toggle de l'aide. Purement cosmétique : il filtre les
// rubriques montrées, il ne remplace PAS l'autorisation (la route est ouverte
// à MANAGER + EMPLOYE).
export type AideRole = 'manager' | 'employe'

// Tonalité d'un encadré `callout`.
export type CalloutTon = 'tip' | 'warn' | 'info'

// Pastille numérotée positionnée sur une capture (coordonnées en %).
export type AideFigurePin = {
  n: number
  x: number
  y: number
}

// Étape d'un parcours en cartes (« journée type »).
export type AideParcoursEtape = {
  n:      string
  titre:  string
  detail: string
}

// Blocs de contenu, discriminés par `type`. Le gras inline s'écrit `**texte**`
// et le code inline `` `texte` `` ; les deux sont rendus par `renderRich`.
export type AideBloc =
  | { type: 'soustitre'; texte: string }
  | { type: 'p';         texte: string }
  | { type: 'liste';     items: string[] }              // liste à puces
  | { type: 'etapes';    items: string[] }              // liste ordonnée numérotée
  | { type: 'callout';   ton: CalloutTon; texte: string; icone?: string }
  | { type: 'tableau';   entetes: string[]; lignes: string[][] }
  | {
      type:    'figure'
      src:     string   // chemin public de la capture, ex. « /aide/pointage.jpg »
      url:     string   // libellé de la barre du navigateur, ex. « /pointage »
      alt:     string
      legende: string
      pins:    AideFigurePin[]
    }
  | { type: 'parcours'; etapes: AideParcoursEtape[] }

// Une rubrique de l'aide.
export type AideRubrique = {
  id:          string
  titre:       string
  managerOnly: boolean
  blocs:       AideBloc[]
}

/**
 * Aplatissement du texte d'une rubrique pour la recherche plein texte de `/aide`.
 * On concatène tout le contenu lisible (titre + blocs), débarrassé des marqueurs
 * `**`/`` ` `` , pour matcher la saisie de l'utilisateur.
 */
import type { AideRubrique, AideBloc } from '@/types/aide'

function blocText(b: AideBloc): string {
  switch (b.type) {
    case 'soustitre':
    case 'p':
      return b.texte
    case 'callout':
      return b.texte
    case 'liste':
    case 'etapes':
      return b.items.join(' ')
    case 'tableau':
      return [...b.entetes, ...b.lignes.flat()].join(' ')
    case 'figure':
      return `${b.alt} ${b.legende}`
    case 'parcours':
      return b.etapes.map(e => `${e.titre} ${e.detail}`).join(' ')
  }
}

/** Texte recherchable d'une rubrique, en minuscules, sans marqueurs de gras/code. */
export function rubriqueSearchText(r: AideRubrique): string {
  const raw = [r.titre, ...r.blocs.map(blocText)].join(' ')
  return raw.replace(/[*`]/g, '').toLowerCase()
}

/** Une rubrique correspond-elle à la requête ? (requête déjà en minuscules) */
export function rubriqueMatches(r: AideRubrique, query: string): boolean {
  if (!query) return true
  return rubriqueSearchText(r).includes(query)
}

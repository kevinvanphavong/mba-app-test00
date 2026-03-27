/**
 * Mock data — Service du Jour (Bowling Central, 19 mars 2026)
 * Aligné sur les fixtures Alice Symfony.
 * Non utilisé en production — la page /service utilise l'API réelle.
 */
import type { ServicePageData } from '@/types/service'

const KEVIN  = { id: 1, nom: 'Kévin V.',  role: 'MANAGER' as const, avatarColor: '#f97316' }
const PATOU  = { id: 2, nom: 'Patou M.',  role: 'EMPLOYE' as const, avatarColor: '#3b82f6' }
const AYA    = { id: 3, nom: 'Aya K.',    role: 'EMPLOYE' as const, avatarColor: '#a855f7' }
const GABIN  = { id: 4, nom: 'Gabin R.',  role: 'EMPLOYE' as const, avatarColor: '#22c55e' }
const ERWAN  = { id: 5, nom: 'Erwan L.',  role: 'EMPLOYE' as const, avatarColor: '#14b8a6' }
const HIBA   = { id: 6, nom: 'Hiba B.',   role: 'EMPLOYE' as const, avatarColor: '#f472b6' }

export const mockServiceData: ServicePageData = {
  service: {
    id:         1,
    date:       '2026-03-19',
    heureDebut: '10:00',
    heureFin:   '22:00',
    statut:     'EN_COURS',
    centreName: 'Bowling Central',
  },

  staff: [KEVIN, PATOU, AYA, GABIN, ERWAN, HIBA],

  zones: [
    {
      id: 1, nom: 'Accueil', couleur: '#3b82f6', ordre: 1,
      postes: [
        { id: 1, user: PATOU },
        { id: 2, user: ERWAN },
      ],
      missions: [
        { id: 1,  texte: 'Allumer les écrans d\'accueil',           categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 1, completionId: 10, completedBy: PATOU },
        { id: 2,  texte: 'Vérifier les casiers de chaussures',      categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 2, completionId: 11, completedBy: PATOU },
        { id: 3,  texte: 'Préparer le comptoir d\'accueil',          categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'important',      ordre: 3, completionId: null, completedBy: null },
        { id: 4,  texte: 'Ouvrir la caisse et faire le fond',       categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 4, completionId: null, completedBy: null },
        { id: 6,  texte: 'Nettoyer la zone d\'attente',              categorie: 'MENAGE',    frequence: 'FIXE',       priorite: 'important',      ordre: 1, completionId: 12, completedBy: ERWAN },
        { id: 7,  texte: 'Vérifier la signalétique',                categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'ne_pas_oublier', ordre: 2, completionId: null, completedBy: null },
        { id: 5,  texte: 'Réapprovisionner les lacets de secours',  categorie: 'PENDANT',   frequence: 'PONCTUELLE', priorite: 'ne_pas_oublier', ordre: 5, completionId: null, completedBy: null },
      ],
    },
    {
      id: 2, nom: 'Bar', couleur: '#a855f7', ordre: 2,
      postes: [
        { id: 3, user: AYA  },
        { id: 4, user: HIBA },
      ],
      missions: [
        { id: 9,  texte: 'Préparer les machines à café',            categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 1, completionId: 13, completedBy: AYA  },
        { id: 10, texte: 'Vérifier les stocks de boissons',         categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 2, completionId: null, completedBy: null },
        { id: 11, texte: 'Nettoyer le comptoir du bar',             categorie: 'MENAGE',    frequence: 'FIXE',       priorite: 'important',      ordre: 3, completionId: null, completedBy: null },
        { id: 12, texte: 'Configurer la caisse du bar',             categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 4, completionId: null, completedBy: null },
        { id: 14, texte: 'Préparer la carte du jour',               categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'ne_pas_oublier', ordre: 2, completionId: 14, completedBy: HIBA },
        { id: 13, texte: 'Commander les boissons en rupture',       categorie: 'PENDANT',   frequence: 'PONCTUELLE', priorite: 'important',      ordre: 1, completionId: null, completedBy: null },
        { id: 15, texte: 'Nettoyer le percolateur',                 categorie: 'FERMETURE', frequence: 'FIXE',       priorite: 'important',      ordre: 3, completionId: null, completedBy: null },
      ],
    },
    {
      id: 3, nom: 'Salle', couleur: '#22c55e', ordre: 3,
      postes: [
        { id: 5, user: GABIN },
        { id: 6, user: KEVIN },
      ],
      missions: [
        { id: 16, texte: 'Vérifier les pistes 1 à 6',              categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 1, completionId: 15, completedBy: GABIN },
        { id: 17, texte: 'Contrôler les machines à boules',         categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 2, completionId: 16, completedBy: GABIN },
        { id: 18, texte: 'Allumer les écrans de score',             categorie: 'OUVERTURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 3, completionId: null, completedBy: null },
        { id: 21, texte: 'Inspecter la sécurité des pistes',        categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'vitale',         ordre: 1, completionId: null, completedBy: null },
        { id: 19, texte: 'Calibrer les détecteurs de quilles',      categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'important',      ordre: 4, completionId: null, completedBy: null },
        { id: 22, texte: 'Tester l\'éclairage de la salle',          categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'important',      ordre: 2, completionId: null, completedBy: null },
        { id: 20, texte: 'Vérifier les pistes 7 à 12',             categorie: 'PENDANT',   frequence: 'FIXE',       priorite: 'vitale',         ordre: 5, completionId: 17, completedBy: GABIN },
        { id: 23, texte: 'Vérifier les sorties de secours',         categorie: 'FERMETURE', frequence: 'FIXE',       priorite: 'vitale',         ordre: 3, completionId: 18, completedBy: KEVIN },
      ],
    },
  ],
}

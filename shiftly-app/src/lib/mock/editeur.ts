import type { EditorZone, EditorMission, EditorCompetence } from '@/types/editeur'

export const mockZones: EditorZone[] = [
  { id: 1, nom: 'Accueil',  couleur: '#3b82f6', ordre: 1, missionCount: 8 },
  { id: 2, nom: 'Bar',      couleur: '#a855f7', ordre: 2, missionCount: 6 },
  { id: 3, nom: 'Salle',    couleur: '#22c55e', ordre: 3, missionCount: 9 },
  { id: 4, nom: 'Manager',  couleur: '#f97316', ordre: 4, missionCount: 5 },
]

export const mockMissions: EditorMission[] = [
  // Accueil — Ouverture
  { id: 1,  zoneId: 1, zoneName: 'Accueil', texte: 'Ouvrir les caisses',           frequence: 'FIXE',      priorite: 'vitale',   categorie: 'OUVERTURE', ordre: 1 },
  { id: 2,  zoneId: 1, zoneName: 'Accueil', texte: 'Vérifier le stock de chaussures', frequence: 'FIXE',   priorite: 'important', categorie: 'OUVERTURE', ordre: 2 },
  { id: 3,  zoneId: 1, zoneName: 'Accueil', texte: 'Calibrer les écrans d\'accueil', frequence: 'PONCTUELLE', priorite: 'ne_pas_oublier', categorie: 'OUVERTURE', ordre: 3 },
  // Accueil — Service
  { id: 4,  zoneId: 1, zoneName: 'Accueil', texte: 'Accueillir les clients',         frequence: 'FIXE',    priorite: 'vitale',   categorie: 'PENDANT',    ordre: 4 },
  { id: 5,  zoneId: 1, zoneName: 'Accueil', texte: 'Gérer les files d\'attente',     frequence: 'FIXE',    priorite: 'vitale',   categorie: 'PENDANT',    ordre: 5 },
  // Accueil — Fermeture
  { id: 6,  zoneId: 1, zoneName: 'Accueil', texte: 'Clôturer les caisses',           frequence: 'FIXE',    priorite: 'vitale',   categorie: 'FERMETURE',  ordre: 6 },
  { id: 7,  zoneId: 1, zoneName: 'Accueil', texte: 'Rangement des chaussures',       frequence: 'FIXE',    priorite: 'important', categorie: 'FERMETURE',  ordre: 7 },
  { id: 8,  zoneId: 1, zoneName: 'Accueil', texte: 'Nettoyage comptoir',             frequence: 'PONCTUELLE', priorite: 'ne_pas_oublier', categorie: 'FERMETURE', ordre: 8 },
  // Bar — Ouverture
  { id: 9,  zoneId: 2, zoneName: 'Bar',     texte: 'Préparer les postes de bar',     frequence: 'FIXE',    priorite: 'vitale',   categorie: 'OUVERTURE',  ordre: 1 },
  { id: 10, zoneId: 2, zoneName: 'Bar',     texte: 'Vérifier stock boissons',        frequence: 'FIXE',    priorite: 'important', categorie: 'OUVERTURE',  ordre: 2 },
  // Bar — Service
  { id: 11, zoneId: 2, zoneName: 'Bar',     texte: 'Service cocktails & softs',      frequence: 'FIXE',    priorite: 'vitale',   categorie: 'PENDANT',    ordre: 3 },
  { id: 12, zoneId: 2, zoneName: 'Bar',     texte: 'Nettoyage verres',               frequence: 'FIXE',    priorite: 'important', categorie: 'PENDANT',    ordre: 4 },
  // Bar — Fermeture
  { id: 13, zoneId: 2, zoneName: 'Bar',     texte: 'Inventaire bar soir',            frequence: 'FIXE',    priorite: 'vitale',   categorie: 'FERMETURE',  ordre: 5 },
  { id: 14, zoneId: 2, zoneName: 'Bar',     texte: 'Nettoyage bar',                  frequence: 'FIXE',    priorite: 'important', categorie: 'FERMETURE',  ordre: 6 },
  // Salle — Ouverture
  { id: 15, zoneId: 3, zoneName: 'Salle',   texte: 'Vérifier les pistes',            frequence: 'FIXE',    priorite: 'vitale',   categorie: 'OUVERTURE',  ordre: 1 },
  { id: 16, zoneId: 3, zoneName: 'Salle',   texte: 'Calibrer les quilles',           frequence: 'FIXE',    priorite: 'vitale',   categorie: 'OUVERTURE',  ordre: 2 },
  { id: 17, zoneId: 3, zoneName: 'Salle',   texte: 'Allumer les systèmes de scores', frequence: 'FIXE',    priorite: 'important', categorie: 'OUVERTURE',  ordre: 3 },
  // Salle — Service
  { id: 18, zoneId: 3, zoneName: 'Salle',   texte: 'Surveiller les pistes',          frequence: 'FIXE',    priorite: 'important', categorie: 'PENDANT',    ordre: 4 },
  { id: 19, zoneId: 3, zoneName: 'Salle',   texte: 'Maintenance pistes en cours',    frequence: 'PONCTUELLE', priorite: 'vitale', categorie: 'PENDANT',   ordre: 5 },
  { id: 20, zoneId: 3, zoneName: 'Salle',   texte: 'Gérer les scores',               frequence: 'FIXE',    priorite: 'important', categorie: 'PENDANT',    ordre: 6 },
  // Salle — Fermeture
  { id: 21, zoneId: 3, zoneName: 'Salle',   texte: 'Nettoyage pistes',               frequence: 'FIXE',    priorite: 'vitale',   categorie: 'FERMETURE',  ordre: 7 },
  { id: 22, zoneId: 3, zoneName: 'Salle',   texte: 'Rangement matériel',             frequence: 'FIXE',    priorite: 'important', categorie: 'FERMETURE',  ordre: 8 },
  { id: 23, zoneId: 3, zoneName: 'Salle',   texte: 'Éteindre les systèmes',          frequence: 'FIXE',    priorite: 'ne_pas_oublier',   categorie: 'FERMETURE',  ordre: 9 },
  // Manager
  { id: 24, zoneId: 4, zoneName: 'Manager', texte: 'Briefing équipe ouverture',      frequence: 'FIXE',    priorite: 'vitale',   categorie: 'OUVERTURE',  ordre: 1 },
  { id: 25, zoneId: 4, zoneName: 'Manager', texte: 'Vérifier présences et plannings', frequence: 'FIXE',  priorite: 'vitale',   categorie: 'OUVERTURE',  ordre: 2 },
  { id: 26, zoneId: 4, zoneName: 'Manager', texte: 'Suivi incidents',                 frequence: 'FIXE',  priorite: 'vitale',   categorie: 'PENDANT',    ordre: 3 },
  { id: 27, zoneId: 4, zoneName: 'Manager', texte: 'Rapport de clôture',              frequence: 'FIXE',  priorite: 'vitale',   categorie: 'FERMETURE',  ordre: 4 },
  { id: 28, zoneId: 4, zoneName: 'Manager', texte: 'Transmission équipe nuit',        frequence: 'PONCTUELLE', priorite: 'important', categorie: 'FERMETURE', ordre: 5 },
]

export const mockCompetences: EditorCompetence[] = [
  // Accueil
  { id: 1,  zoneId: 1, zoneName: 'Accueil', nom: 'Gestion caisse',          difficulte: 'simple',      points: 10, description: 'Savoir ouvrir, gérer et clôturer une caisse.' },
  { id: 2,  zoneId: 1, zoneName: 'Accueil', nom: 'Accueil client',          difficulte: 'simple',      points: 10, description: 'Accueillir chaleureusement et orienter les clients.' },
  { id: 3,  zoneId: 1, zoneName: 'Accueil', nom: 'Gestion chaussures',      difficulte: 'avancee',     points: 20, description: 'Maîtriser le stock et l\'attribution de chaussures.' },
  { id: 4,  zoneId: 1, zoneName: 'Accueil', nom: 'Réservations & files',    difficulte: 'avancee',     points: 20, description: 'Gérer les réservations et optimiser les files d\'attente.' },
  // Bar
  { id: 5,  zoneId: 2, zoneName: 'Bar',     nom: 'Préparation boissons',    difficulte: 'simple',      points: 10, description: 'Préparer softs, bières et boissons chaudes.' },
  { id: 6,  zoneId: 2, zoneName: 'Bar',     nom: 'Cocktails de base',       difficulte: 'avancee',     points: 20, description: 'Réaliser les cocktails signature du centre.' },
  { id: 7,  zoneId: 2, zoneName: 'Bar',     nom: 'Gestion stock bar',       difficulte: 'avancee',     points: 20, description: 'Inventaire, commandes et rotation des stocks.' },
  { id: 8,  zoneId: 2, zoneName: 'Bar',     nom: 'Mixologie avancée',       difficulte: 'experimente', points: 40, description: 'Créer et adapter des cocktails originaux.' },
  // Salle
  { id: 9,  zoneId: 3, zoneName: 'Salle',   nom: 'Maintenance pistes',      difficulte: 'simple',      points: 10, description: 'Entretien courant des pistes de bowling.' },
  { id: 10, zoneId: 3, zoneName: 'Salle',   nom: 'Calibration quilles',     difficulte: 'avancee',     points: 20, description: 'Calibrer le releveur de quilles et vérifier les alignements.' },
  { id: 11, zoneId: 3, zoneName: 'Salle',   nom: 'Système de scores',       difficulte: 'avancee',     points: 20, description: 'Maîtriser le logiciel d\'affichage des scores.' },
  { id: 12, zoneId: 3, zoneName: 'Salle',   nom: 'Réparation matériel',     difficulte: 'experimente', points: 40, description: 'Diagnostiquer et résoudre les pannes courantes.' },
  // Manager
  { id: 13, zoneId: 4, zoneName: 'Manager', nom: 'Gestion d\'équipe',       difficulte: 'avancee',     points: 20, description: 'Animer, briefer et coordonner les équipes.' },
  { id: 14, zoneId: 4, zoneName: 'Manager', nom: 'Gestion des incidents',   difficulte: 'avancee',     points: 20, description: 'Gérer les situations critiques avec sang-froid.' },
  { id: 15, zoneId: 4, zoneName: 'Manager', nom: 'Reporting & analytics',   difficulte: 'experimente', points: 40, description: 'Analyser les KPIs et produire des rapports de performance.' },
]

/** Catégories disponibles pour les missions */
export const CATEGORIES = ['Ouverture', 'Service', 'Fermeture', 'Entretien', 'Autre']

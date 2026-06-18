/**
 * State local de ModalRegistreFiche — extrait du composant pour respecter
 * la limite de 150 lignes / composant (CLAUDE.md règle 3).
 */

import type { Sexe, StaffMember } from '@/types/staff'

export const DEFAULT_AVATAR_COLOR = '#f97316'

export interface FicheState {
  nom: string; prenom: string; email: string; password: string
  role: 'MANAGER' | 'EMPLOYE'
  tailleHaut: string; tailleBas: string; pointure: string
  actif: boolean; avatarColor: string
  heuresHebdo: string; typeContrat: string; dateEmbauche: string; codePointage: string
  emploi: string
  dateNaissance: string; sexe: Sexe | ''
  lieuNaissanceCommune: string; lieuNaissanceDepartement: string
  nationalite: string; nomNaissance: string; numeroSecuriteSociale: string
  adresse: string; codePostal: string; ville: string; telephone: string
}

export function emptyFicheState(): FicheState {
  return {
    nom: '', prenom: '', email: '', password: '', role: 'EMPLOYE',
    tailleHaut: '', tailleBas: '', pointure: '',
    actif: true, avatarColor: DEFAULT_AVATAR_COLOR,
    heuresHebdo: '', typeContrat: '', dateEmbauche: '', codePointage: '0000',
    emploi: '',
    dateNaissance: '', sexe: '',
    lieuNaissanceCommune: '', lieuNaissanceDepartement: '',
    nationalite: '', nomNaissance: '', numeroSecuriteSociale: '',
    adresse: '', codePostal: '', ville: '', telephone: '',
  }
}

export function ficheStateFromMember(m: StaffMember): FicheState {
  return {
    nom: m.nom, prenom: m.prenom ?? '', email: m.email, password: '', role: m.role,
    tailleHaut: m.tailleHaut ?? '', tailleBas: m.tailleBas ?? '', pointure: m.pointure ?? '',
    actif: m.actif, avatarColor: m.avatarColor ?? DEFAULT_AVATAR_COLOR,
    heuresHebdo:  m.heuresHebdo != null ? String(m.heuresHebdo) : '',
    typeContrat:  m.typeContrat ?? '',
    dateEmbauche: m.dateEmbauche ?? '',
    codePointage: m.codePointage ?? '',
    emploi:        m.emploi ?? '',
    dateNaissance: m.dateNaissance ?? '',
    sexe:          m.sexe ?? '',
    lieuNaissanceCommune:     m.lieuNaissanceCommune ?? '',
    lieuNaissanceDepartement: m.lieuNaissanceDepartement ?? '',
    nationalite: m.nationalite ?? '',
    nomNaissance:          m.nomNaissance ?? '',
    numeroSecuriteSociale: m.numeroSecuriteSociale ?? '',
    adresse:     m.adresse ?? '',
    codePostal:  m.codePostal ?? '',
    ville:       m.ville ?? '',
    telephone:   m.telephone ?? '',
  }
}

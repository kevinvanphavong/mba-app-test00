/**
 * Constantes typographiques sémantiques — Shiftly
 *
 * Utilisation : import { ty } from '@/lib/typography'
 * Exemple     : <span className={ty.meta}>Texte secondaire</span>
 * Override    : <span className={`${ty.meta} text-green`}>Terminé</span>
 *
 * Convention de nommage :
 *   - Pas de suffixe  → taille standard
 *   - Suffixe Sm      → variante plus petite
 *   - Suffixe Lg      → variante plus grande
 */
export const ty = {

  // ─── Labels de section ──────────────────────────────────────────────────────
  // "POSTES · 3", "MANAGER", "COMPÉTENCES", etc.
  sectionLabel:   'text-[9px]  font-syne font-bold uppercase tracking-widest text-muted',
  sectionLabelMd: 'text-[10px] font-bold uppercase tracking-wider text-muted',

  // ─── Textes secondaires / meta ──────────────────────────────────────────────
  // Timestamps, sous-titres, infos secondaires, compteurs
  metaSm: 'text-[10px] text-muted',
  meta:   'text-[11px] text-muted',
  metaLg: 'text-[12px] text-muted',

  // ─── Grands chiffres KPI ────────────────────────────────────────────────────
  // Chiffres du dashboard, pourcentages, valeurs proéminentes
  kpi:   'font-syne font-extrabold text-[28px] leading-none text-text',
  kpiMd: 'font-syne font-extrabold text-[22px] leading-none text-text',
  kpiSm: 'font-syne font-extrabold text-[15px] text-text',

  // ─── Titres de cartes / panneaux ────────────────────────────────────────────
  // Noms de zones, titres de tutoriels, en-têtes de cartes
  cardTitle:   'font-syne font-bold text-[13px] text-text',
  cardTitleMd: 'font-syne font-bold text-[14px] text-text',
  cardTitleLg: 'font-syne font-extrabold text-[16px] text-text leading-tight',

  // ─── Corps de texte ─────────────────────────────────────────────────────────
  // Contenu courant, descriptions, notes
  body:      'text-[12px] text-text',
  bodyMuted: 'text-[12px] text-muted',
  bodyLg:    'text-[13px] text-text',

  // ─── Texte de badge ─────────────────────────────────────────────────────────
  // Texte à l'intérieur des badges — couleur à ajouter via override
  badge:   'text-[9px]  font-extrabold',
  badgeMd: 'text-[10px] font-bold',
  badgeLg: 'text-[11px] font-semibold',

  // ─── Labels UI / interactions ───────────────────────────────────────────────
  // Étiquettes de formulaire, boutons toggle, liens d'action
  label:      'text-[11px] font-semibold text-text',
  labelMuted: 'text-[11px] font-semibold text-muted',

  // ─── Statistiques Syne ──────────────────────────────────────────────────────
  // Points, scores, compteurs dans les cartes membres
  statSyne: 'text-[11px] font-syne font-bold text-muted',

} as const

export type TyKey = keyof typeof ty

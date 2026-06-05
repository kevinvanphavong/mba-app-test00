# Design system — Module Validation hebdomadaire (classes CSS)

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md)


Préfixe : `.validation-*` — toutes définies dans `globals.css`

| Classe | Usage |
|--------|-------|
| `.validation-week-control` | Barre navigation semaine (surface + border + radius) |
| `.validation-week-label` | "Semaine N" — Syne bold |
| `.validation-week-dates` | Plage de dates — muted 12px |
| `.validation-week-arrow` | Boutons ← → navigation |
| `.validation-status-badge` | Badge statut semaine (`data-status`: en_attente / validee / en_cours) |
| `.validation-status-badge-small` | Badge compact dans tableau (même data-status) |
| `.validation-kpi-card` | Carte KPI (extend `.kpi-card`) |
| `.validation-kpi-trend` | Ligne tendance sous valeur KPI (`.up` vert, `.down` rouge) |
| `.validation-table` | Tableau principal (collapse, font-size 13px) |
| `.validation-row` | Ligne employé (`data-status`: validated / pending / issue) |
| `.validation-employee-name` | Nom employé dans tableau |
| `.validation-employee-role` | Zone/rôle sous le nom |
| `.validation-day-cell` | Cellule jour (`data-status`: travaille / repos / absent_justifie / absent_non_justifie / en_cours) |
| `.validation-total-cell` | Cellule totaux (`.green` / `.red` / `.orange`) |
| `.validation-row-note` | Note textuelle sous badge statut |
| `.validation-detail-head` | Tête panneau détail employé V2 (avatar + nom + total heures) |
| `.validation-detail-head__avatar` | Avatar circulaire dégradé accent (initiales) |
| `.validation-detail-head__total-val` | Heures nettes semaine (Syne 18px) |
| `.validation-day-row` | Ligne jour V2 (grid 70px · 1fr · 88px) |
| `.validation-day-row--has-correction` | Fond ambré + marqueur orange (`__dot`) à gauche |
| `.validation-day-row--empty-arrival` | Fond rouge léger (arrivée manquante) |
| `.validation-day-row__net` / `__delta` | Heures nettes + écart `--up` (vert) / `--down` (rouge) |
| `.validation-day-row__empty-cta` | Bouton "Pointer arrivée maintenant" (rouge pointillé) |
| `.validation-time-pill` | Pilule horaire cliquable (variants `--ok / --late / --auto / --modified / --empty / --neutral`) |
| `.validation-time-pill__old/__new/__arrow` | Diff inline (ancienne barrée → nouvelle accent) |
| `.validation-time-pill__auto-tag` | Tag "auto" jaune (heure de fin non pointée) |
| `.validation-popover` | Popover TimePicker (280px, surface3 + shadow) |
| `.validation-popover__time-big` | Affichage gros (Syne 28px accent) |
| `.validation-popover__grid` | Grille 4 boutons ±5 / ±15 |
| `.validation-popover__shortcuts` | Maintenant / Heure plan. / Input time fallback |
| `.validation-chip` / `.validation-chip--selected` | Chip motif (preset 5 + Autre…) |
| `.validation-bulk-bar` | Bandeau bulk "Appliquer le départ planifié à tous" |
| `.validation-detail-foot` | Footer panneau (valider / annuler validation) |
| `.validation-history` | Section historique corrections (titre + count + état vide) |
| `.validation-timeline` | Timeline verticale (ligne accent + dots) |
| `.validation-timeline__motif` | Chip motif dans timeline |
| `.validation-timeline__undo` | Bouton ↺ Annuler (rouge au hover) |
| `.validation-summary-stat` | Ligne stat résumé semaine |
| `.validation-summary-stat-value` | Valeur stat (`.blue` / `.green` / `.red` / `.accent`) |
| `.validation-summary-sub` | Sous-détail (noms employés concernés) |
| `.validation-alert-item` | Ligne alerte légale |
| `.validation-alert-icon` | Icône alerte (`data-severity`: warn / danger / ok) |
| `.validation-inprogress-dot` | Point animé pour statut en_cours |
| `.validation-mobile-modal` | Overlay modal bottom sheet (mobile, `lg:hidden`) |
| `.validation-mobile-modal-sheet` | Feuille bottom sheet (border-radius top) |


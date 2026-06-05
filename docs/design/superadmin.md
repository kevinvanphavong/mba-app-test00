# Design system — Back-office SuperAdmin

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md)


Le back-office `/superadmin/*` a son propre layout séparé de l'app classique. Il est accessible uniquement aux comptes `ROLE_SUPERADMIN` et utilise des composants dédiés.

### 11.1 Sidebar SuperAdmin

- **Largeur** : 240px fixe, position `fixed` left/top
- **Fond** : `surface3` (#111318) — plus sombre que la sidebar app classique
- **Logo** : gradient Syne `from-accent to-accent-light` + point text blanc + badge "SuperAdmin" (gradient inversé)
- **Sections** : les items sont groupés par phase avec un label uppercase muted
  - Phase 1 — Monitoring
  - Phase 2 — Billing
  - Phase 3 — Users & Support
  - Phase 4 — Système
- **Items** : emoji icon + label + badge optionnel. Item actif = fond `accent/10`, texte `accent`, border-left 3px `accent`
- **Items désactivés** (phases pas encore livrées) : `opacity-50` + `pointer-events-none`
- **User card footer** : avatar initiales gradient + nom + rôle "Fondateur"

### 11.2 KPI Card (Dashboard)

- Fond `surface`, bordure `border`, radius `14px`, padding `18px`
- Barre d'accent top 2px (couleur selon KPI : `accent`, `green`, `blue`, `red`)
- Header : label uppercase muted + icône 32×32 en fond teinté 10%
- Valeur : Syne extrabold 30px, couleur thématique
- Trend : 11px, `text-green` (up) / `text-red` (down) / `text-muted` (neutral)
- **Tag contextuel** (V2, prop `tag` de `StatCard`) : badge gris neutre coin
  sup. droit (10px bold uppercase, `bg-surface2 text-muted`, exclusif avec
  `trend`). Ex : `En cours`, `+N ce mois`, `À traiter`, `Moy. équipe`.

### 11.2bis Hero Service V2 (Dashboard manager)

Composant : `components/dashboard/HeroService.tsx`. Section unique en haut
du dashboard, refondue en V2 avec quatre régions empilées :

1. **Bandeau statut** : badge statut (Planifié/En cours/Terminé) ; en
   `EN_COURS` le badge bascule sur `LIVE` avec un pulse Framer Motion
   (`animate={{ opacity: [1, 0.55, 1] }}`, 1.4s, infini) + dot vert 6×6.
2. **Bloc principal** : nom du jour `font-syne extrabold` (24/28px), horaires
   `→`, ligne « Prénom(s) · Manager responsable » (issue de `Service.managers`,
   masquée si vide).
3. **Cercle de progression globale** : SVG 96×96, radius 38, `arcGradient`
   orange, pourcentage centré (composant inchangé V1 → V2).
4. **Progression par zone** : grille adaptative selon le nombre de zones du
   service du jour, triées par `pct ASC` puis `nom ASC` :

   | Viewport | Layout |
   |---|---|
   | mobile (< 500px)               | `grid-cols-1` |
   | tablet (≥ 500px)               | `tablet:grid-cols-2` |
   | desktop (≥ 900px) — 1 zone     | `desktop:grid-cols-1` |
   | desktop — 2 ou 4 zones         | `desktop:grid-cols-2` |
   | desktop — 3 ou 5+ zones        | `desktop:grid-cols-3` |

   Chaque carte : dot couleur zone + nom + `pct%` (couleur zone) + barre
   1.5px (couleur zone) + ligne `completed/total mission(s)`.
5. **En service** : avatars du `staffEnService` empilés (`-space-x-2`, max 8
   visibles + chip `+N` pour le surplus), count `N membre(s) actif(s)`.

### 11.3 Widget Shell

- Container : `surface` + border + radius `14px`, overflow hidden
- Header : titre Syne bold 14px avec icône + action link `accent` optionnel, séparateur bottom
- Body : padding 14px vertical / 18px horizontal

### 11.4 Quick Stats (bande compacte)

- Grid 5 colonnes, gap 12px
- Card : `surface` + border + radius `10px`, padding `12px 14px`
- Label : 10px uppercase muted
- Valeur : Syne extrabold 20px, couleur thématique (text/green/blue/yellow/red)

### 11.5 Row Actions (boutons carrés)

- Carré 28×28, radius `6px`
- Fond `surface2`, bordure `border`, texte muted
- Hover : bordure + texte `accent`, fond `surface`
- Contenu : emoji 13px ou caractère

### 11.6 Status Badges SuperAdmin

| Statut | Classes |
|---|---|
| Actif | `bg-green/15 text-green` + dot 8px |
| Suspendu | `bg-red/15 text-red` |
| Essai | `bg-blue/15 text-blue` |
| Échéance proche | `bg-yellow/15 text-yellow` |

Tous : padding `0.125rem 0.625rem`, radius `12px`, font-size 10px, bold.

### 11.7 Plan Badges

| Formule | Classes |
|---|---|
| Starter | `bg-muted/15 text-muted` |
| Pro | `bg-blue/15 text-blue` |
| Enterprise | `bg-purple/15 text-purple` |

Padding `2px 8px`, radius `6px`, font-size 10px, uppercase bold.

### 11.8 Bandeau impersonation

- Position `fixed top`, z-index `9999`
- Fond `red`, texte blanc, padding `10px 20px`
- Animé avec Framer Motion (slide-down + opacity)
- Contenu : "🔴 Vous êtes connecté au centre : {nom}" + bouton "Quitter" (fond `white/20`, radius 6px)
- Visible si `isImpersonating === true` dans `superAdminStore`
- Monté à la fois dans le layout SuperAdmin et le layout `(app)` classique

### 11.9 Panel détail centre

- Fond `surface`, bordure, radius `14px`
- Header avec titre Syne + action link optionnel
- Body : InfoRow avec label gauche muted + value droite bold

### 11.10 Danger Zone

- Fond `red/5`, bordure `red/20`, radius `14px`, padding `18px`
- Titre Syne 13px rouge uppercase tracking 1px
- Boutons : fond transparent + bordure `red/30` + texte rouge 12px bold
- Hover : fond `red/10`

### 11.11 Module Leads (`/superadmin/leads`)

Module de gestion des prospects capturés via la landing publique. Réutilise
les patterns existants (KPI Card §11.2, Filters §11.3, Status Badges §11.6,
Plan Badges §11.7) avec quelques spécificités.

**Lead KPI Bar** (4 cartes, grille 4 colonnes)

- Nouveaux ce mois — Syne extrabold 20px, `text-text`, caption "X non traités"
- Taux de conversion — Syne extrabold 20px, `text-green`
- Leads > 48h non traités — bascule sur `text-yellow` si > 0 (signal d'attention)
- MRR potentiel — somme des plans choisis × prix mensuel, `text-accent`

**Status Badges Lead** (badge + dot animé)

```
Nouveau   → bg-accent/15 text-accent  · dot accent (à traiter en priorité)
Contacté  → bg-blue/15   text-blue    · dot blue
Qualifié  → bg-yellow/15 text-yellow  · dot yellow
Converti  → bg-green/15  text-green   · dot green (deal signé)
Perdu     → bg-red/15    text-red     · dot red
```

**LeadDetailPanel** — page `/superadmin/leads/[id]`

- Hero : titre Syne extrabold 26px (nom du prospect) + status badge + plan badge
- Workflow strip : 5 boutons (un par status) — l'actif prend la couleur du status, les autres sont neutres
- Grid 2 colonnes des champs (sm 1 col, lg 2 col) — labels uppercase 10px muted
- Notes internes : textarea `surface2` 6 rows + flash "Enregistré ✓" 1.8s en `text-green`
- Actions inline : `mailto:` (accent) + `tel:` (green) en boutons pill

**LeadsTable** — listing principal

- Colonnes : Reçu (formatDistance fr) · Intent (emoji + label) · Plan (badge) · Contact (nom + email) · Centre · Ville · Statut · Actions
- Pas de zebra strip — bordure 1px `border/50` entre les rows
- Hover row : `bg-accent/5`

**LeadsFilters** — chips multi-sélection (status / intent / plan) + search input

- Pattern identique aux filters Centres (`/superadmin/centres`) : chip neutre →
  on click bascule sur `bg-accent/10 text-accent border-accent/30`
- Bouton "Réinitialiser" en `text-muted hover:text-accent` quand au moins
  un filtre est actif

**Badge sidebar** — l'item "Leads" affiche un badge rouge avec le nombre de
leads `status=nouveau` (récupéré via `useLeadsStats`, refetch 60s).

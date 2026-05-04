# Shiftly — Design System

> Extrait des fichiers HTML de référence Centrio · Mars 2026
> Stack : Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion

---

## 1. Identité & Branding

**Nom produit :** Shiftly
**Logo :** `Shiftly.` — "Shiftly" en orange accent, le point "." en blanc
**Police logo :** Syne 800
**Tagline :** Système de management opérationnel pour parcs de loisirs

---

## 2. Typographie

| Usage | Police | Poids | Taille |
|-------|--------|-------|--------|
| Logo / Titres H1 | Syne | 800 | 22–28px |
| Titres H2 panels | Syne | 800 | 13–20px |
| Chiffres KPI | Syne | 800 | 24–32px |
| Corps de texte | DM Sans | 400–500 | 12–14px |
| Labels UI | DM Sans | 600–700 | 10–12px |
| Badges / Tags | DM Sans | 700 | 9–11px |
| Section labels | Syne | 700 | 11px, uppercase, letter-spacing 1.5px |

**Import Google Fonts :**
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
```

**Tailwind config :**
```js
fontFamily: {
  syne: ['Syne', 'sans-serif'],
  sans: ['DM Sans', 'sans-serif'],
}
```

---

## 3. Palette de Couleurs

### Variables CSS fondamentales

```css
:root {
  /* Arrière-plans */
  --bg:       #0d0f14;   /* fond principal */
  --surface:  #151820;   /* cartes, sidebars */
  --surface2: #1c2030;   /* surfaces secondaires, inputs */

  /* Bordures */
  --border:   #252a3a;

  /* Texte */
  --text:     #e8eaf0;   /* texte principal */
  --muted:    #6b7280;   /* texte secondaire */

  /* Accent principal (orange) */
  --accent:   #f97316;   /* orange Shiftly */
  --accent2:  #fb923c;   /* orange clair (gradient) */

  /* Couleurs sémantiques */
  --blue:     #3b82f6;   /* zone Accueil */
  --green:    #22c55e;   /* succès, terminé */
  --red:      #ef4444;   /* erreur, incident haute priorité */
  --yellow:   #eab308;   /* avertissement, incident moyen */
  --purple:   #a855f7;   /* zone Bar */
  --indigo:   #6366f1;
  --teal:     #14b8a6;
  --pink:     #f472b6;
}
```

### Couleurs par zone

| Zone | Couleur | Hex |
|------|---------|-----|
| Accueil | Bleu | `#3b82f6` |
| Bar | Violet | `#a855f7` |
| Salle | Vert | `#22c55e` |
| Manager | Orange | `#f97316` |

### Tokens Tailwind

```js
colors: {
  bg:       '#0d0f14',
  surface:  '#151820',
  surface2: '#1c2030',
  border:   '#252a3a',
  text:     '#e8eaf0',
  muted:    '#6b7280',
  accent:   { DEFAULT: '#f97316', light: '#fb923c' },
  zone: {
    accueil: '#3b82f6',
    bar:     '#a855f7',
    salle:   '#22c55e',
  }
}
```

---

## 4. Spacing & Layout

| Token | Valeur |
|-------|--------|
| Border radius card | 16–20px |
| Border radius badge | 6–10px |
| Border radius modal | `24px 24px 0 0` |
| Gap standard | 14–18px |
| Padding card | 16–24px |
| Scrollbar width | 4px |

**Grilles desktop :**
- Stats 4 colonnes : `grid-cols-4`
- 3 colonnes : `grid-cols-3`
- Calendar + List : `grid-cols-[1fr_1.1fr]`

**Layout mobile :** max-width 390px, padding 20px, bottom-nav fixed

---

## 5. Composants

### 5.1 Sidebar (Desktop / iPad)

```
Width: 240px desktop / 220px iPad
Background: surface
Border-right: 1px border
Padding: 22px 14px

Structure:
  Logo "Shiftly."  (Syne 800, accent)
  Centre name (11px, muted)
  Section label (9px, uppercase, tracking-wide)
  Nav items (13px, DM Sans 500, muted)
    active  → bg rgba(249,115,22,0.1)  color accent  fw 700
    hover   → bg surface2  color text
  Badges : bg red  9px  fw 800  rounded-[5px]
  Bottom user row : avatar 34px + nom + rôle
```

### 5.2 Bottom Nav (Mobile)

```
position: fixed bottom-0
bg: surface  border-top: 1px border
5 items : Service · Postes · Staff · Tutoriels · Réglages
active   → opacity-100  color accent
inactive → opacity-40
icon: 20px  label: 10px fw600
```


### 5.3 Hero Card / Service Card

```css
/* Barre accent en haut */
.hero::before {
  height: 3px;
  background: linear-gradient(90deg, #f97316, #fb923c);
}
```
- Progress bars : h-[7px] bg surface2, fill gradient accent
- Live badge : `bg-[rgba(249,115,22,0.12)]` + dot pulsing

### 5.4 Stat Card (KPI)

```
bg surface  border  rounded-2xl  p-4
Icon: 20px emoji
Chiffre: Syne 800 28px
Label: 12px muted
Trend badge (top-right): green/red/neutral bg
```

### 5.5 Panel Section

```
bg surface  border  rounded-[18px]  p-4
Header: title (Syne 800 13px) + action link (accent 11px)
```

### 5.6 Checklist Item

```
bg surface  border  rounded-xl  p-3
Checkbox: 20px w/h, rounded-md, border-2
  done: bg green border-green ✓ white
  done text: line-through muted opacity-50
Priority dot: w-[6px] h-[6px] rounded-full (red/yellow/muted)
```

### 5.7 Member Card (Staff)

```
rounded-[18px]  expand/collapse on click
Avatar: 48px rounded-[14px] gradient
Status dot: 12px circle bottom-right (green=actif, yellow=pause)
Expanded: border-color rgba(249,115,22,0.35)
  → Zones chips colorées
  → Level dots (5 dots, filled=accent)
  → Vêtements box (surface2)
```

### 5.8 Tutoriel Card

```
rounded-2xl  hover: translateX(3px)
Read indicator: 28px circle top-right
  unread: surface2 muted
  read:   rgba(34,197,94,0.15) green ✓
Steps: w-[24px] h-[24px] rounded-lg surface2 accent text
Tip box: rgba(249,115,22,0.07) bg  rgba(249,115,22,0.15) border
Mark-read btn → done: green
```

### 5.9 Modal Bottom Sheet

```
overlay: rgba(0,0,0,0.7) backdrop-blur(4px)
modal: rounded-t-3xl  bg surface  border
handle: w-[40px] h-[4px] bg border  mx-auto
animation: translateY(100%) → translateY(0)  0.3s ease
```

### 5.10 Toggles

```
w-[44px] h-[24px] rounded-full
off: bg surface2  border
on:  bg green
thumb: 16px circle  left 3→23px transition
```

### 5.11 Zone Tags

```
Accueil: bg rgba(59,130,246,0.12)  text #3b82f6  border rgba(59,130,246,0.2)
Bar:     bg rgba(168,85,247,0.12)  text #a855f7  border rgba(168,85,247,0.2)
Salle:   bg rgba(34,197,94,0.12)   text #22c55e  border rgba(34,197,94,0.2)
Manager: bg rgba(249,115,22,0.1)   text #f97316  border rgba(249,115,22,0.15)
```

### 5.12 Priority / Difficulty Tags

```
vitale:         bg rgba(239,68,68,0.15)   text red
important:      bg rgba(234,179,8,0.15)   text yellow
ne_pas_oublier: bg rgba(107,114,128,0.15) text muted
simple:         bg rgba(34,197,94,0.1)    text green
avancee:        bg rgba(249,115,22,0.1)   text accent
experimente:    bg rgba(168,85,247,0.1)   text purple
```

### 5.13 Staff Chips / Avatars empilés

```
chip: flex items-center gap-1.5  bg surface2  border  rounded-full  px-2.5 py-1.5
avatar: 22–26px rounded-full  fw800  border-2 surface  margin-left -4px
```

---

### 5.14 Services Planning — Vue desktop (≥ lg)

La page `/services` propose une vue desktop dense distincte du rendu mobile. L'orchestration vit dans [`ServicesDesktopView.tsx`](shiftly-app/src/components/services/ServicesDesktopView.tsx) ; chaque bloc est isolé et réutilisable.

#### Hero card

```
container: relative overflow-hidden bg-surface border border-border rounded-[18px] p-5
           accent-bar (barre orange 3px en haut, classe globale)
           grid-cols-[1fr_auto] gap-6 items-center
gauche:    label "SERVICES" (ty.sectionLabel, mb-1.5)
           titre "Services {centre}" (font-syne text-[22px] font-extrabold)
           + LIVE badge si ≥1 EN_COURS (animate-ping sur dot 8px + label)
           sous-titre compteurs (ty.metaLg)
droite:    KPI card "Tx clôture" (bg-surface2 border rounded-[10px] min-w-[88px])
             couleur valeur : ≥90→green, 70-89→yellow, <70→red, null→muted "—"
           bouton + Nouveau service (bg-gradient-to-r from-accent to-accent2,
             font-syne font-bold text-[11px], hover:opacity-90)
```

#### Onglets

```
container: flex gap-1.5 bg-surface border border-border rounded-[10px] p-1 w-fit
tab actif: bg-surface2 text-text + compteur bg-accent text-white
tab inactif: text-muted hover:text-text + compteur bg-bg border text-muted
ordre: En cours · À venir · Historique
```

#### Filtre période

```
inputs: 2 × <input type="date"> bg-surface2 border rounded-[7px] px-2 py-1
        + bouton × reset si dates définies
raccourcis: 7J · 30J · TOUT (font-syne uppercase tracking-[0.6px])
            ±N jours autour de today via getPeriodShortcut() de lib/serviceFilters
compteur: ml-auto text-[11px] text-muted "{n} résultat(s)"
```

#### Tableau

```
grille colonnes: grid-cols-[24px_160px_130px_70px_1fr_200px_140px_110px] gap-2.5
header: bg-surface2 border-b border-border py-2.5
        labels ty.sectionLabelMd : (chevron) Date Horaires Staff Équipe Zones Responsable Statut
ligne: cliquable, py-3.5 px-4
       hover bg-surface2/50, ouverte bg-surface2
       chevron ▸ rotate-90 via transition-transform duration-200
       border-b border-border sauf dernière (sauf si ouverte → border maintenue)
statut chip:
  EN_COURS   bg-accent/12 text-accent border-accent/25 + dot pulsant + "En cours"
  PLANIFIE   bg-blue/10   text-blue   border-blue/20   + "Planifié"
  TERMINE    bg-green/10  text-green  border-green/20  + "Clôturé"
```

#### Panneau dépliant (3 sections)

```
1. Zones & Staff (manager + statut PLANIFIE/EN_COURS)
   - card par zone : dot couleur + nom font-syne extrabold + compteur · N
   - chips membres : avatar gradient + nom + bouton × (useDeletePoste)
   - bouton + Membre tinté à zone.couleur (10% bg, 30% border, color = zone)
2. Progression (toujours)
   - grid-cols-[160px_1fr_50px] : dot + nom / barre 1.5px h / pourcentage
   - largeur fill = zone.taux %, background = zone.couleur, transition 400ms
3. Note (pattern repris de ServiceCard.tsx)
   - lecture : bg-surface border rounded-[10px] whitespace-pre-wrap
   - édition : textarea + boutons Annuler / Enregistrer
   - useAddServiceNote pour la mutation
```

Animation expand : variant `expandVariants` de `lib/animations.ts` (overflow-hidden + height auto + AnimatePresence). Une seule ligne ouverte à la fois (`expandedId: number | null`).

---

## 6. Animations

| Composant | Animation |
|-----------|-----------|
| Live dot | `pulse` opacity 1→0.3 / 1.5s infinite |
| Expand card | `▼` rotate-180, content display:block |
| Modal bottom sheet | translateY(100%)→0 / 0.3s ease |
| List items | `fadeUp` : opacity0 + translateY(8px)→0 / 0.3s |
| Hover cards | translateY(-1px) ou translateX(3px) |
| Progress bars | `width transition 0.5s ease` |
| Toggle thumb | left 3→23px / 0.25s |

**Framer Motion variants recommandées :**
```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}
export const slideUp = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', damping: 30 } }
}
```

---

## 7. Architecture Pages (Next.js App Router)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (app)/
│   ├── layout.tsx          ← sidebar desktop + bottom nav mobile
│   ├── dashboard/page.tsx  ← Manager only
│   ├── service/page.tsx    ← Service du Jour
│   ├── services/page.tsx   ← Planning (Manager only)
│   ├── postes/page.tsx     ← Fiches postes
│   ├── staff/page.tsx      ← Gestion équipe
│   ├── tutoriels/page.tsx  ← Tutoriels
│   └── reglages/page.tsx   ← Paramètres
```

---

## 8. Schéma de Données (MVP)

### Entités principales

| Entité | Champs clés |
|--------|-------------|
| **Centre** | id, nom, adresse, type_activite, horaire_ouverture/fermeture |
| **User** | id, centre_id, nom, email, role (MANAGER/EMPLOYE), actif, points_total, niveau |
| **Zone** | id, centre_id, nom, couleur, ordre, archivee |
| **Mission** | id, zone_id, titre, categorie (OUVERTURE/PENDANT/MENAGE/FERMETURE), priorite, type (FIXE/PONCTUELLE) |
| **Competence** | id, zone_id, titre, description, difficulte, priorite, points |
| **UserCompetence** | id, user_id, competence_id, validee_par, validee_le |
| **Service** | id, centre_id, date, heure_ouverture/fermeture, manager_id, statut, taux_completion |
| **Assignation** | id, service_id, user_id, zone_id |
| **TaskCompletion** | id, service_id, mission_id, user_id, completee, completee_le |
| **Incident** | id, centre_id, service_id, zone_id, description, severite, statut, cree_par |
| **Tutoriel** | id, centre_id, zone_id, titre, contenu (richtext), niveau, mis_en_avant, publie |
| **TutorielLu** | id, tutoriel_id, user_id, lu_le |

### Multi-tenant
Chaque entité est isolée par `centre_id`. Le JWT embarque `centre_id` pour filtrer auto toutes les requêtes API.

---

## 9. Modules MVP

| # | Module | Manager | Employé | Statut |
|---|--------|---------|---------|--------|
| 1 | Dashboard | Vue synthèse complète | ✗ | Inclus |
| 2 | Service du Jour | Crée, supervise, incidents | Voit + coche | Inclus |
| 3 | Services Journaliers | Planning + historique | ✗ | Inclus |
| 4 | Postes | CRUD missions + compétences | Lecture seule | Inclus |
| 5 | Staff | CRUD complet, valide compétences | Voir collègues | Inclus |
| 6 | Tutoriels | CRUD + suivi lecture équipe | Lit + marque lu | Inclus |
| 7 | Réglages | Accès complet + éditeur | Notifs + infos | Inclus |
| 8 | Gestion du contenu | Zones + missions + compétences | ✗ | Dans Réglages |
| 9 | Pointage — Validation hebdo | Relire + valider + corriger heures | ✗ | Inclus |

---

## 10. Module Validation Hebdomadaire — Classes CSS

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
| `.validation-detail-row` | Ligne du panneau détail jour par jour |
| `.validation-detail-day` | Jour + numéro (accent, bold) |
| `.validation-detail-times` | Bloc heures (arrivée, pauses, départ) |
| `.validation-detail-net` | Heures nettes (Syne, vert) |
| `.validation-correction-history` | Bloc historique corrections |
| `.validation-summary-stat` | Ligne stat résumé semaine |
| `.validation-summary-stat-value` | Valeur stat (`.blue` / `.green` / `.red` / `.accent`) |
| `.validation-summary-sub` | Sous-détail (noms employés concernés) |
| `.validation-alert-item` | Ligne alerte légale |
| `.validation-alert-icon` | Icône alerte (`data-severity`: warn / danger / ok) |
| `.validation-correction-form` | Container formulaire correction (surface2 + border) |
| `.validation-inprogress-dot` | Point animé pour statut en_cours |
| `.validation-mobile-modal` | Overlay modal bottom sheet (mobile, `lg:hidden`) |
| `.validation-mobile-modal-sheet` | Feuille bottom sheet (border-radius top) |

---

## 11. Back-office SuperAdmin

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
   | mobile (`< md`)        | `grid-cols-1` |
   | tablette (`md`, ≥ 768) | `grid-cols-2` |
   | desktop (`lg`, ≥ 1200) — 1 zone        | `grid-cols-1` |
   | desktop — 2 ou 4 zones                  | `grid-cols-2` |
   | desktop — 3 ou 5+ zones                 | `grid-cols-3` |

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

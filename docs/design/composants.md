# Design system — Composants

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md)


### 5.1 Sidebar (Desktop ≥ 900px) — V2

```
Width: 240px expanded / 64px collapsed (animation Framer Motion 0.22s easeInOut)
Background: surface
Border-right: 1px border
Padding: 24px 12px (expanded) / 24px 8px (collapsed)

Structure :
  Logo "Shiftly."  (Syne 800, accent)   — collapsed → juste « S. »
  Centre name (10px, muted)              — masqué en collapsed
  Sections groupées (4) :
    - Pilotage (Dashboard — manager)
    - Opérations (Service du jour, Pointage, Validation hebdo)
    - Planification (Planning, Services)
    - Équipe (Staff, Postes, Tutoriels)
    Header section : 9px Syne 700 uppercase tracking-widest muted
                     → collapsed : remplacé par un séparateur fin (border-t border-border, mx-3)
  Footer (hors regroupement) :
    - Bouton Apparence (popover Framer Motion AnimatePresence, click-outside + Escape)
    - Réglages (item nav classique)
    - User row : avatar + nom + rôle  → collapsed : avatar seul + tooltip droit au hover
    - Toggle collapsed (chevrons-left ↔ chevrons-right)

Items :
  Padding : px-3 py-2.5 (expanded) / mx-auto w-10 h-10 centré (collapsed)
  active  → bg accent/10  color accent  fw 700
  hover   → bg surface2  color text
  Collapsed : tooltip Framer Motion ancré à droite, offset 8px, 0.12s easeOut
```

**Toggle / persistance**
- Bouton chevrons en bas de sidebar (toujours visible).
- Raccourci global `Ctrl/Cmd + B` (ignoré si focus dans `input`/`textarea`/`[contenteditable]`).
- Persistance : `localStorage` clé `shiftly:sidebar-collapsed` (`'0'` / `'1'`).
- Hydration safe : initial render serveur → `false`, lecture localStorage dans `useEffect` au mount.
- Fallback silencieux en cas de localStorage bloqué (Safari privé).

**Sections — modèle de données**
Voir `src/lib/navigation.ts` : chaque `NavItem` a un champ `section`. `SECTION_ORDER` + `SECTION_LABELS` exportés. Le hook `useNavItems` retourne `{ sections, footer }` — les sections vides (filtrées par rôle) sont automatiquement omises.

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

### 5.7 Staff v3 — Encart table + MemberRow + MemberPanel + SkillTag

```
.staff-table-card
  Encart unique englobant headers + lignes.
  bg surface, border 1px var(--border), rounded-[14px], overflow:hidden.
  Les filtres (tabs/search/results) sont rendus AU-DESSUS, pas dedans.

.staff-tab (Tous / Managers / Membres)
  Style ghost local au module : transparent au repos, surface2 + border + text actif.
  padding 8/16, rounded-[10px], font 13/600.

MemberRow (.staff-member-row)
  display: grid; grid-template-columns: 2fr 100px 1.6fr 140px 130px 120px;
  padding: 16px 24px 16px 40px (chevron à 18px); border-bottom 1px var(--border).
  Pas de border-radius / margin-bottom : la card parente gère le rendu.
  ::before chevron ▸ — rotate 90° + accent quand .expanded.
  Identité du "vous" : badge inline "Vous" — plus de border-left orange.
  Avatar : 44px rounded-[12px] gradient (sans ring 2px).
  .presence-dot : 12px absolu bottom/right -2px, green par défaut, muted si data-present="false",
                  border 2px var(--surface).
  Cols : Identity · Role badge · Zones (chips colorées) · Level dots (4×9px) · Points · Tutos
  Points : Syne 22px, barre 70px×4px gradient accent→accent2.
  Tutoriels : layout horizontal flex gap-2.5 (texte + barre 60px).
  Niveau : 4 paliers via calculerNiveau() — Débutant <30% / Intermédiaire 30-60% /
           Confirmé 60-90% / Avancé ≥90%

MemberPanel (.staff-member-panel)
  Pas de border / radius : intégré dans la card parente.
  bg rgba(var(--bg-rgb), 0.5), padding 4px 24px 18px 40px.
  3 sections : SkillCardsByZone · info-row (3 cols) · actions-row.
  Boutons sans emoji : "Modifier la fiche" / "Ajouter une compétence" / "Désactiver".

SkillTag (motion.button)
  rounded-md px-2.5 py-1 text-[11px] font-semibold border.
  Acquired : background = `${zoneCouleur}1f`, border = `${zoneCouleur}66`,
             color = zone color + ✓ prefix.
  Non-acquired : surface neutre.
  Highlight 1.5s : Framer Motion (scale + box-shadow pulsé) — pas de keyframe CSS.

Mobile (< 980px)
  .staff-table-headers : display:none.
  .staff-member-row : grid → 1 col, .col → flex-start, padding 16px,
                      ::before chevron disparaît (display:none).
  .staff-member-panel : padding 4px 16px 18px.
  .skill-grid + .info-row : 1 col.
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

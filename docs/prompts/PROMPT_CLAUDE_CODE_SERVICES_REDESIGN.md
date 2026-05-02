# Prompt Claude Code — Refonte page `/services` (vue desktop manager)

> Objectif : aligner la page `/services` sur la maquette desktop fournie par Kévin (cf. `docs/maquettes/services-redesign-reference.jsx` + screenshot Claude Design du 2026-05-02), **sans toucher au backend ni au schéma BDD**, en gardant 100% des fonctionnalités actuelles.

---

## 1. Contexte

Tu travailles sur **Shiftly**, app SaaS de management opérationnel pour parcs de loisirs. Stack : Symfony 8 + API Platform (back), Next.js 14 + TypeScript strict + Tailwind (front). Le projet est en production (~12 centres clients).

La page `/services` actuelle est entièrement **mobile-first** : une liste verticale de cards `ServiceCard` (composant existant), groupée en sections « Aujourd'hui / À venir / Passés ». Elle fonctionne mais manque :

- d'une vue desktop dense (tableau)
- d'onglets « En cours / À venir / Historique »
- d'un filtre par période
- d'un KPI taux de clôture
- d'un hero de page identifiable

La maquette desktop ajoute tout cela. **Le but de ce chantier est uniquement frontend.** Pas de migration Doctrine, pas de nouvel endpoint API.

---

## 2. Ton positionnement

- Tu es un **développeur senior fullstack** qui livre du code production-ready.
- Tu respectes **strictement** les **15 règles absolues** du fichier `CLAUDE.md` (lis-le en premier, à la racine du repo).
- Tu fais des **commits atomiques** (cf. règle 14 du CLAUDE.md : un commit par modif, pas de push, Kévin pousse lui-même).
- Tu **testes après chaque commit** (`npm run build` côté front au minimum).
- Tu **mets à jour les docs de référence** (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`) à chaque modification structurelle.

---

## 3. Lecture obligatoire avant de coder

Lis **dans cet ordre**, en intégralité :

1. `CLAUDE.md` — conventions du projet, design system, 15 règles absolues
2. `DESIGN_SYSTEM.md` — tokens couleurs, typographie, composants
3. `docs/maquettes/services-redesign-reference.jsx` — maquette JSX brute fournie par Kévin (référence visuelle/comportementale UNIQUEMENT, à ne PAS copier-coller)
4. `shiftly-app/src/app/(app)/services/page.tsx` — page actuelle
5. `shiftly-app/src/components/services/ServiceCard.tsx` — card actuelle (mobile)
6. `shiftly-app/src/components/services/ModalCreateService.tsx` — modale création (réutilisable)
7. `shiftly-app/src/components/services/ModalAssignerPoste.tsx` — modale assignation (réutilisable)
8. `shiftly-app/src/types/index.ts` — types `ServiceListItem`, `ServiceListZone`, `ServiceListZonePoste`, `ServiceListManager`, `ServiceListStaffMember`
9. `shiftly-app/src/hooks/useService.ts` — hooks React Query existants (`useServicesList`, `useDeleteService`, `useAddServiceNote`, `useDeletePoste`, `useCreatePoste`, `useUpdateService`, `useCreateService`)
10. `shiftly-app/src/lib/animations.ts` — variants Framer Motion (`listVariants`, `listItemVariants`, `expandVariants`, `fadeUpVariants`)
11. `shiftly-app/src/lib/typography.ts` — système `ty`
12. `shiftly-app/src/lib/cn.ts` — utilitaire className
13. `shiftly-app/src/lib/serviceUtils.ts` — `getEffectiveToday()`, `isTodayService()`, `findTodayService()`
14. `shiftly-app/src/components/ui/ZoneTag.tsx` — chip zone (existant, à réutiliser)
15. `shiftly-app/src/components/layout/Topbar.tsx` — top bar actuelle

**Ne code rien tant que tu n'as pas lu ces fichiers.** Tu dois comprendre les patterns en place.

---

## 4. Cadre du chantier — décisions déjà prises

| Sujet | Décision |
|---|---|
| Responsive | **Tableau desktop ≥ `lg` (1024px) + cards mobile inchangées en-dessous.** Le composant `ServiceCard.tsx` actuel reste utilisé tel quel sur mobile. Aucune régression mobile. |
| Migration BDD | **Aucune.** Pas de champ `responsable` ni `nom_evenement` ajouté. La colonne « Responsable » du tableau utilise `service.managers[0]?.nom` (déjà présent dans `ServiceListItem`). Pas de label événement affiché. |
| Statuts | **3 statuts BDD existants** uniquement : `PLANIFIE` / `EN_COURS` / `TERMINE`. Pas de statut « Attention » ni « Incidents » dérivé. |
| Auth | Page **manager only** (déjà le cas). Si `!isManager` → redirection ou message. |
| Données | **Aucun nouvel endpoint.** On consomme `useServicesList()` existant. Filtrage onglets + période = côté front. |
| Format prompt | Pas de maquette HTML séparée — la maquette JSX de référence + screenshot suffisent. |

---

## 5. Spécification UI — Desktop ≥ `lg`

> **Référence visuelle** : `docs/maquettes/services-redesign-reference.jsx` + screenshot fourni dans la conversation Cowork.
> **Adaptation Shiftly** : utiliser tokens Tailwind du projet (`bg-surface`, `text-accent`, `border-border`, etc.) — JAMAIS de couleur hex hardcodée. Pas de styles inline `style={{...}}` pour les couleurs.

### 5.1 Hero card (haut de page)

- Container : `bg-surface border border-border rounded-[18px] p-5` avec barre orange dégradée 3px en haut (similaire au pattern `.shiftly-hero-bar` ou `bg-gradient-to-r from-accent to-accent2 h-[3px]` en absolute top).
- Grille 2 colonnes : `grid-cols-[1fr_auto] gap-6 items-center`
- Colonne gauche (info) :
  - Mini-label « SERVICES » : `font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-muted`
  - Titre : `font-syne text-[22px] font-extrabold text-text` → `Services {centreName}`
  - À droite du titre, badge LIVE conditionnel (uniquement si au moins un service `EN_COURS`) : pastille orange 8px qui pulse + texte « LIVE » en `bg-accent/15 text-accent` rounded-full px-2 py-0.5 text-[10px] font-bold. Réutilise l'animation `pulse` déjà présente dans `ServiceCard` pour la pastille (Framer Motion ou CSS via `animate-ping`).
  - Sous-titre : `text-[12px] text-muted` → `Vue manager · {n_en_cours} service{s} en cours · {n_a_venir} à venir cette semaine · {n_passes_30j} derniers clôturés`
- Colonne droite (KPI + bouton) : flex gap-2.5
  - **Carte KPI Tx clôture** : `bg-surface2 border border-border rounded-[10px] px-3.5 py-2.5 min-w-[84px] text-center`. Label `font-syne text-[9px] uppercase tracking-wide text-muted` → « TX CLÔTURE ». Valeur `font-syne text-[18px] font-extrabold` colorée selon le seuil :
    - `≥ 90%` → `text-green`
    - `70-89%` → `text-yellow`
    - `< 70%` → `text-red`
  - **Bouton « + Nouveau service »** : `bg-accent text-white font-syne font-bold text-[11px] px-3.5 h-[38px] rounded-[10px] hover:bg-accent/90 active:scale-[0.97] transition-all`. Ouvre `ModalCreateService` existant.

### 5.2 Barre onglets + filtre période

Sous le hero, en flex `gap-2.5 items-center flex-wrap`.

**Onglets** (3 tabs, dans un conteneur) :
- Conteneur : `flex gap-1.5 bg-surface border border-border rounded-[10px] p-1 w-fit`
- Tab inactif : `px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-muted` + compteur en pastille `bg-bg border border-border text-muted text-[10px] font-bold px-1.5 py-px rounded-[5px] ml-1.5`
- Tab actif : `bg-surface2 text-text` + compteur `bg-accent text-white border-none`
- Ordre : `En cours` (n) · `À venir` (n) · `Historique` (n)

**Filtre période** (à droite des onglets) :
- Conteneur : `flex items-center gap-1.5 bg-surface border border-border rounded-[10px] px-2.5 py-1`
- Label « PÉRIODE » : `font-syne text-[10px] font-bold uppercase tracking-wide text-muted`
- Deux inputs `<input type="date">` stylés `bg-surface2 border border-border rounded-[7px] px-2 py-1 text-[11px] text-text font-sans`. Entre les deux : flèche `→` muted.
- Bouton `×` (clear) si au moins une date est définie.

**Raccourcis période** (à droite du filtre) :
- 3 mini-boutons `7J`, `30J`, `TOUT` : `font-syne text-[10px] font-bold uppercase tracking-[0.6px] px-2.5 py-1.5 rounded-[7px] border border-border bg-surface text-muted hover:text-text hover:border-accent/40`
- `7J` : `dateFrom = today - 7 jours`, `dateTo = today + 7 jours` (ou logique adaptée — voir §6.3)
- `30J` : `dateFrom = today - 30 jours`, `dateTo = today + 30 jours`
- `TOUT` : `dateFrom = ''`, `dateTo = ''`

**Compteur résultats** (extrême droite, `ml-auto`) : `text-[11px] text-muted` → `{list.length} résultat{s}`

### 5.3 Tableau

- Container : `bg-surface border border-border rounded-[14px] overflow-hidden`
- Grille des colonnes (à appliquer sur header ET chaque ligne) : `grid grid-cols-[24px_160px_130px_70px_1fr_200px_140px_110px] gap-2.5 px-4 py-3.5 items-center`
- Header : `bg-surface2 border-b border-border font-syne text-[10px] font-bold uppercase tracking-wide text-muted py-2.5`
  - Colonnes : `(chevron)` · `Date` · `Horaires` · `Staff` · `Équipe` · `Zones` · `Responsable` · `Statut` (text-right)
- Ligne de service (cliquable pour déplier) :
  - `cursor-pointer transition-colors hover:bg-surface2/50`
  - État ouvert : `bg-surface2`
  - Bordure bottom entre lignes : `border-b border-border` sauf dernière
  - Contenu :
    - **Chevron** : `▸` qui rotate à 90° quand `isOpen`. Animer la rotation via Framer Motion (transition 0.2s) ou simple CSS `transition-transform`.
    - **Date** : `text-[12px] font-bold text-text` formatée via `format(parseISO(date), 'EEE d MMM', { locale: fr })` (capitalisée). Ligne secondaire si onglet `Historique` → `text-[10px] text-muted` → `Tâches {tauxCompletion}%` (pas de comptage incidents pour l'instant). Ligne secondaire si onglet `En cours` → mini-barre `tauxCompletion` (90px × 4px, gradient accent) + `{tauxCompletion}%`.
    - **Horaires** : `font-syne font-bold text-[11px] text-text/80` → `{heureDebut} – {heureFin}`. Si null → `—`.
    - **Staff** (count) : `text-[12px] font-semibold text-text` → `service.staff.length`.
    - **Équipe** (avatar bubbles) : créer un sous-composant `<TeamBubbles members={service.staff} max={4} />`. 4 bubbles max + bulle `+N` si plus. Avatars 24px ronds, gradient sur `member.avatarColor`, initiale en blanc, border-2 surface, marges négatives -7px. Hover title = nom complet.
    - **Zones** : `flex gap-1 flex-wrap` de `<ZoneTag zone={zone.nom} size="xs" />` (composant existant).
    - **Responsable** : `text-[12px] text-text/80` → `service.managers[0]?.nom ?? '—'`. Si plusieurs managers, n'afficher que le premier (nom court). Tooltip optionnel listant tous les managers.
    - **Statut** (chip à droite) : `text-right`, chip `text-[10px] font-bold uppercase tracking-[0.4px] px-2.5 py-1 rounded-[6px]` :
      - `EN_COURS` : `bg-accent/12 text-accent border border-accent/25` + dot 6px accent qui pulse + label `● EN COURS`
      - `PLANIFIE` : `bg-blue/10 text-blue border border-blue/20` + label `PLANIFIÉ`
      - `TERMINE` : `bg-green/10 text-green border border-green/20` + label `CLÔTURÉ`

### 5.4 Ligne dépliante (panel ServiceExpand)

Quand une ligne est dépliée, afficher un panel `bg-bg px-6 py-5 border-b border-border` (ou pas de border si dernière ligne) contenant 3 sections :

#### 5.4.1 Section « Zones & Staff » (visible si `canEdit` = manager + statut PLANIFIE ou EN_COURS)

- Label `font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-muted mb-3.5`
- Pour chaque zone du centre (via `useZones()`) :
  - Card `bg-surface border border-border rounded-[14px] px-4 py-3 flex items-center gap-3.5 flex-wrap`
  - À gauche (`min-w-[120px] flex items-center gap-2`) : pastille 8px couleur zone + nom zone (`font-syne text-[14px] font-extrabold text-text`) + compteur `text-[11px] text-muted font-semibold` → `· {n_postes}`
  - Au milieu (`flex-1 flex gap-2 flex-wrap`) : chips membres assignés. Chip = `inline-flex items-center gap-1.5 bg-surface2 border border-border rounded-full pl-1 pr-2 py-1` avec mini-avatar 22px + nom + bouton `×` qui appelle `useDeletePoste()` sur le `posteId`.
  - À droite : bouton `+ Membre` tinté avec la couleur de la zone : `bg-{zoneColor}/10 border border-{zoneColor}/30 text-{zoneColor} rounded-full px-3.5 py-1.5 text-[12px] font-bold`. Au clic → ouvre `ModalAssignerPoste` pré-paramétrée avec `zoneId`.

> ⚠️ Pas de couleur hex inline. Utiliser `style={{ backgroundColor: \`${zone.couleur}1f\`, color: zone.couleur, border: \`1px solid ${zone.couleur}40\` }}` est tolérable car la couleur vient de la BDD (cf. règle 1 du CLAUDE.md, exception déjà appliquée dans `ServiceCard.tsx` actuel).

#### 5.4.2 Section « Progression » (visible pour tous les statuts si zones non vides)

- Label `font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-muted mb-3.5`
- Pour chaque zone du service :
  - Grille `grid grid-cols-[160px_1fr_50px] items-center gap-3.5`
  - Gauche : dot couleur zone + nom zone (`text-[13px] text-text font-medium`)
  - Milieu : barre `h-1.5 bg-surface2 rounded-full overflow-hidden` avec fill `style={{ width: \`${zone.taux}%\`, backgroundColor: zone.couleur }}` et transition 0.4s
  - Droite : `font-syne text-[12px] text-muted font-semibold text-right` → `{zone.taux}%`

#### 5.4.3 Section « Note »

- Label `font-syne text-[10px] font-bold uppercase tracking-[1.5px] text-muted` + bouton à droite (`+ Ajouter` / `Modifier` selon contexte)
- Comportement déjà présent dans `ServiceCard.tsx` actuel — **reproduire le même pattern** (textarea avec `useAddServiceNote` mutation, mode édition vs lecture).
- Container note (lecture) : `bg-surface border border-border rounded-[10px] px-3 py-2.5 text-[12px] text-text leading-relaxed whitespace-pre-wrap`

---

## 6. Comportements

### 6.1 Filtrage par onglet (front)

```ts
const today = getEffectiveToday() // depuis serviceUtils.ts

const tabs = {
  encours:   services.filter(s => s.statut === 'EN_COURS'),
  avenir:    services.filter(s => s.statut === 'PLANIFIE' && s.date >= today),
  historique: services.filter(s => s.statut === 'TERMINE' || (s.statut === 'PLANIFIE' && s.date < today)),
}
```

> Cas limite : un service `PLANIFIE` dont la date est passée → bucket Historique (non terminé manuellement).

### 6.2 Tri

- `encours` : tri date ascendant
- `avenir` : tri date ascendant
- `historique` : tri date descendant

### 6.3 Filtre période

- 2 états locaux `dateFrom: string` et `dateTo: string` (format `YYYY-MM-DD`).
- Filtre appliqué sur le tab actif : `s.date >= dateFrom && s.date <= dateTo` (chaînes ISO comparables lexicographiquement).
- Raccourcis :
  - `7J` : `dateFrom = format(subDays(now, 7), 'yyyy-MM-dd')`, `dateTo = format(addDays(now, 7), 'yyyy-MM-dd')`
  - `30J` : ±30 jours
  - `Tout` : reset les deux à `''`
- Persistance optionnelle : aucune (état non sauvegardé entre navigations dans cette V1).

### 6.4 KPI Taux de clôture

```ts
// Sur les services TERMINE et PLANIFIE-passés de la fenêtre [dateFrom, dateTo]
// (ou [today-30j, today] si dateFrom/dateTo non définis)
const totalDansFenetre = services.filter(s => /* dans la fenêtre ET (TERMINE OR PLANIFIE-passé) */ ).length
const cloturesTermines = services.filter(s => /* idem ET statut === TERMINE */).length
const tauxCloture = totalDansFenetre > 0 ? Math.round((cloturesTermines / totalDansFenetre) * 100) : 0
```

> Si `totalDansFenetre === 0`, afficher `—` au lieu de `0%`.

### 6.5 Toggle expansion ligne

- Un seul service déplié à la fois (state local `expandedId: number | null`).
- Chevron rotate avec Framer Motion ou CSS `transition-transform 0.2s`.
- Panel dépliant animé avec `expandVariants` de `lib/animations.ts` (déjà utilisé dans `ServiceCard`).

### 6.6 Switch desktop ↔ mobile

Un seul fichier `page.tsx`. Sur mobile (`< lg`), garder la **liste de cards `ServiceCard` actuelle** (rien à toucher). Sur desktop (`≥ lg`), afficher le **tableau**. Utiliser :

```tsx
<div className="lg:hidden"> {/* mobile : cards comme avant */} </div>
<div className="hidden lg:block"> {/* desktop : tableau */} </div>
```

> Les hooks (`useServicesList`, etc.) sont mutualisés — un seul appel API.

### 6.7 États

Respecter la **règle absolue n°6 : 3 états par composant**.

- **Loading** : skeleton hero (placeholder gris) + skeleton tableau (4 lignes `h-12 bg-surface2 animate-pulse`)
- **Erreur** : carte `bg-surface border-red/20` avec emoji ⚠️, message, bouton « Réessayer »
- **Empty** (aucun service tout court) : carte centrée `bg-surface border-border` avec emoji 📅, message, bouton « Créer le premier service »
- **Tab vide** (filtre / onglet ne renvoie rien) : ligne du tableau « Aucun service sur cette période. » centrée, padding 10

---

## 7. Fichiers à créer / modifier

### Nouveaux fichiers

| Fichier | Rôle |
|---|---|
| `shiftly-app/src/components/services/ServicesHero.tsx` | Hero card (titre, badge live, KPI, bouton) — max 150 lignes |
| `shiftly-app/src/components/services/ServicesTabs.tsx` | Onglets + compteurs — max 60 lignes |
| `shiftly-app/src/components/services/ServicesPeriodFilter.tsx` | Filtre période (date pickers + raccourcis) — max 100 lignes |
| `shiftly-app/src/components/services/ServicesTable.tsx` | Tableau desktop avec ligne + dépliant — peut dépasser 150 lignes → **découper** en `ServicesTableHeader.tsx`, `ServicesTableRow.tsx`, `ServicesTableExpanded.tsx` |
| `shiftly-app/src/components/services/TeamBubbles.tsx` | Avatars empilés (réutilisable) — max 50 lignes |
| `shiftly-app/src/lib/serviceFilters.ts` | Helpers purs : `filterByTab`, `filterByPeriod`, `computeClotureRate`, `getTabBuckets` — testés mentalement |

### Fichiers modifiés

| Fichier | Quoi |
|---|---|
| `shiftly-app/src/app/(app)/services/page.tsx` | Refonte complète : split `<MobileView />` (cards actuelles) vs `<DesktopView />` (nouveau tableau). Topbar conservée OU remplacée par hero (au choix : si hero affiché en `lg:` only, garder Topbar pour mobile). |
| `shiftly-app/src/components/services/ServiceCard.tsx` | **Aucune modification.** Composant mobile inchangé. |
| `ARCHITECTURE.md` | Mettre à jour la section Modules : Services Planning a une vue desktop tableau distincte de la vue mobile cards. Mentionner les nouveaux composants. |
| `DESIGN_SYSTEM.md` | Ajouter une sous-section « Services Planning — Vue desktop » qui documente : hero pattern, onglets pattern, filtre période, ligne tableau dépliante. |

---

## 8. Conventions à respecter (les 15 règles absolues, condensées)

1. ❌ Aucune couleur hex hardcodée — toujours tokens Tailwind (`bg-surface`, `text-accent`) ou variable CSS via `style={{ color: zone.couleur }}` quand la valeur vient de la BDD.
2. ❌ Aucun `any` TypeScript. Si tu manques de type, écris-le ou enrichis `types/index.ts`.
3. ✅ Un fichier composant ≤ 150 lignes. Au-delà → découpe.
4. ✅ Mobile-first : la vue mobile reste la vue par défaut, le tableau est greffé via `lg:`.
5. ❌ Pas de `fetch()` ni `useEffect` pour les API. Tout via React Query.
6. ✅ 3 états par composant : loading / error / empty.
7. ✅ Commentaires en **français**.
8. ❌ Pas de logique métier dans les composants → extraire dans `lib/serviceFilters.ts` ou hooks.
9. ❌ Pas de modif `.env`.
10. ✅ Auth via Zustand (`useAuthStore`).
11. ✅ JWT en localStorage (déjà géré par `lib/api.ts`).
12. ✅ Animations Framer Motion uniquement, jamais de CSS keyframes custom. Utilise les variants de `lib/animations.ts` (`expandVariants`, `listVariants`, `listItemVariants`, `fadeUpVariants`).
13. ✅ Mise à jour `ARCHITECTURE.md` + `DESIGN_SYSTEM.md` à chaque ajout structurel.
14. ✅ Commits atomiques. **Ne pas push.**
15. ✅ Pas de migration générée en SQLite — sans objet ici, **on ne touche pas à la BDD**.

> Bonus pattern projet : utiliser `ty.cardTitleMd`, `ty.metaSm`, etc. (`lib/typography.ts`) pour rester cohérent avec le reste du code.

---

## 9. Séquence de commits suggérée

| # | Commit | Quoi |
|---|---|---|
| 1 | `feat(services): add serviceFilters helpers (filterByTab, computeClotureRate)` | Crée `lib/serviceFilters.ts` avec les fonctions pures + tests mentaux |
| 2 | `feat(services): add TeamBubbles component` | `components/services/TeamBubbles.tsx` |
| 3 | `feat(services): add ServicesHero component` | `components/services/ServicesHero.tsx` |
| 4 | `feat(services): add ServicesTabs component` | `components/services/ServicesTabs.tsx` |
| 5 | `feat(services): add ServicesPeriodFilter component` | `components/services/ServicesPeriodFilter.tsx` |
| 6 | `feat(services): add ServicesTable + Header + Row + Expanded` | 4 fichiers (`ServicesTable.tsx`, `ServicesTableHeader.tsx`, `ServicesTableRow.tsx`, `ServicesTableExpanded.tsx`) |
| 7 | `feat(services): wire desktop view into page.tsx` | Modif `page.tsx` : split mobile/desktop |
| 8 | `docs: update ARCHITECTURE.md with new Services components` | |
| 9 | `docs: add Services desktop section to DESIGN_SYSTEM.md` | |

> Test après chaque commit : `npm run build` côté front passe sans erreur TS. Vérification visuelle après commit 7.

---

## 10. Test final (avant de t'arrêter)

- [ ] `npm run build` passe sans erreur ni warning bloquant.
- [ ] Vue mobile (`< lg`) : aucune régression visuelle. Cards `ServiceCard` rendues comme avant.
- [ ] Vue desktop (`≥ lg`) : hero + onglets + filtre + tableau s'affichent comme dans la maquette.
- [ ] Onglets fonctionnent : compteurs corrects, switch sans flash, chaque onglet filtre proprement.
- [ ] Filtre période : les 3 raccourcis fonctionnent, les inputs date filtrent en temps réel, le bouton `×` reset.
- [ ] KPI Tx clôture : valeur cohérente avec les services affichés, couleur ok selon seuil.
- [ ] Badge LIVE : présent uniquement s'il y a au moins un service `EN_COURS`.
- [ ] Cliquer une ligne déploie le dépliant. Cliquer à nouveau le replie. Une seule ligne ouverte à la fois.
- [ ] Bouton « + Membre » d'une zone ouvre `ModalAssignerPoste` pré-paramétré avec la bonne zone.
- [ ] Note : édition + sauvegarde fonctionnelles via `useAddServiceNote`.
- [ ] Suppression d'un membre via `×` fonctionne via `useDeletePoste`.
- [ ] `ARCHITECTURE.md` et `DESIGN_SYSTEM.md` mis à jour.
- [ ] Tous les commits sont atomiques. Pas de push.

---

## 11. Gestion des problèmes

Si tu rencontres un blocage :

1. **Résous-le** (ne contourne pas).
2. Si tu dois adapter la spec, **ajoute une note en fin de ce fichier** (`docs/prompts/PROMPT_CLAUDE_CODE_SERVICES_REDESIGN.md`) sous une rubrique `## 12. Notes d'implémentation` avec : problème, solution, fichier concerné.
3. Continue la séquence — ne recommence pas du début.

Cas typiques anticipés :
- **`useServicesList` ne renvoie pas tous les champs nécessaires** → vérifier d'abord la réponse réelle de l'endpoint `/api/services/list` (curl/console). Adapter les types si besoin, **sans toucher au backend** sauf nécessité absolue (et dans ce cas, demander avant à Kévin).
- **Bouton accent prend une couleur fade en survol** → utiliser `hover:bg-accent/90` (pattern déjà en place dans `ServiceCard`).
- **Le tableau déborde sur écran étroit `lg`** → réduire la colonne `Équipe` ou cacher la colonne `Responsable` à `< xl:` (1280px). Documenter le choix.
- **Animation chevron saccadée** → utiliser `transition-transform duration-200` Tailwind direct, pas Framer (plus léger pour une rotation simple).

---

## 12. Récap rapide

| Phase | Quoi | Test |
|---|---|---|
| Lecture | CLAUDE.md + DESIGN_SYSTEM.md + maquette + fichiers existants | Compréhension |
| Helpers | `lib/serviceFilters.ts` | TS compile |
| Composants atomiques | TeamBubbles, Hero, Tabs, PeriodFilter | `npm run build` après chaque |
| Tableau | Table + Header + Row + Expanded | `npm run build` |
| Intégration | page.tsx split mobile/desktop | Visuel + interactions |
| Docs | ARCHITECTURE + DESIGN_SYSTEM | — |
| Final | Checklist §10 | Toutes les cases cochées |

**Vas-y. Lis d'abord, code ensuite. Commits atomiques. Pas de push. Tu poses des questions à Kévin si tu hésites.**

# Sidebar V2 — Élargissement + mode collapsed + groupes + theme popover

> Refondre la sidebar desktop : largeur 240px, mode réduit 64px persisté, items regroupés par sections statiques, theme switcher en popover.

## Contexte
La sidebar actuelle (`Sidebar.tsx`, 89 lignes, largeur 220px) liste 10 items à plat sous un seul label "Navigation", avec un `ThemeSwitcher` qui prend trop de place et ne permet aucune réduction. On veut : (1) plus d'air pour le contenu principal sur les pages denses, (2) une nav lisible par catégories, (3) un footer compact.

## Décisions actées
| Sujet | Valeur |
|---|---|
| Largeur expanded | **240px** |
| Largeur collapsed | **64px** (icônes seules + tooltip au hover) |
| Toggle | Bouton flèche en bas de sidebar (`chevrons-left` ↔ `chevrons-right`) |
| Persistance | `localStorage` clé `shiftly:sidebar-collapsed` (bool) |
| Raccourci | `Ctrl/Cmd + B` (capture global, ignore si focus dans input/textarea) |
| Animation | Framer Motion sur la largeur, `duration: 0.22, ease: 'easeInOut'` |
| Theme | Un seul bouton « Apparence » → popover ancré à droite (Framer Motion `AnimatePresence`) qui reprend le contenu actuel de `ThemeSwitcher` |
| Tablette | **Aucun changement** — drawer burger conservé < 900px |

### Sections (variante A — titres statiques, validée)
- **Pilotage** : Dashboard
- **Opérations** : Service du jour, Pointage, Validation hebdo
- **Planification** : Planning, Services
- **Équipe** : Staff, Postes, Tutoriels
- **Footer** (hors section) : Apparence, Réglages

## Fichiers à lire avant de coder
- `CLAUDE.md` — règles absolues (notamment 1, 3, 4, 10, 12, 13), ligne 164 à corriger (220 → 240/64)
- `DESIGN_SYSTEM.md` — ligne 196 à corriger, section "Sidebar" à compléter
- `shiftly-app/src/lib/navigation.ts` — ajouter un champ `section` aux items
- `shiftly-app/src/hooks/useNavItems.ts` — adapter pour exposer les groupes
- `shiftly-app/src/components/layout/Sidebar.tsx` — refonte complète (à découper)
- `shiftly-app/src/components/layout/MobileDrawer.tsx` — adopter les sections (cohérence visuelle)
- `shiftly-app/src/components/layout/ThemeSwitcher.tsx` — logique à réutiliser dans le popover

## Tâche
1. **Modèle de données** — `navigation.ts` : ajouter `section: 'pilotage' | 'operations' | 'planification' | 'equipe' | 'footer'` à chaque `NavItem`. Exposer un mapping `SECTION_LABELS` et `SECTION_ORDER`. `Apparence` et `Réglages` → section `footer`.
2. **Hook** — `useNavItems` : exposer un retour groupé `{ sections: { id, label, items: NavItemWithActive[] }[], footer: NavItemWithActive[] }`. La logique `withActive` reste identique.
3. **Hook nouveau** — `shiftly-app/src/hooks/useSidebarCollapsed.ts` : gère lecture/écriture `localStorage` + listener `keydown` global Ctrl/Cmd+B (ignore si `target` est `input`/`textarea`/`[contenteditable]`). Retourne `{ collapsed, toggle, set }`.
4. **Composants nouveaux** (un fichier chacun, ≤ 150 lignes) dans `shiftly-app/src/components/layout/` :
   - `SidebarItem.tsx` — link + icône + label, gère le mode `collapsed` (label masqué, tooltip Framer Motion `AnimatePresence` au hover, ancré à droite, offset 8px).
   - `SidebarSection.tsx` — header `{label}` (uppercase, tracking, muted, font Syne) + liste d'`SidebarItem`. En mode `collapsed`, header masqué — on garde juste un séparateur fin (`border-t border-border` court).
   - `SidebarToggle.tsx` — bouton chevrons en bas, `aria-label` dynamique.
   - `ThemeSwitcherPopover.tsx` — bouton « Apparence » + popover ancré (position absolue, click-outside ferme, `Escape` ferme). Réutilise la logique de `ThemeSwitcher.tsx` (importer ou copier les helpers nécessaires). En mode `collapsed` le bouton ne montre que l'icône et le popover s'ouvre à droite.
5. **Sidebar.tsx** — refonte : `motion.aside` avec largeur animée 240 ↔ 64, padding adaptatif, header logo (en collapsed → juste le « S »), itère sur `useNavItems().sections` puis rend le bloc footer (theme popover + Réglages + user row compact). Le user row en collapsed → juste l'avatar centré, tooltip avec `prénom nom — rôle`.
6. **MobileDrawer.tsx** — adopter le même groupement par sections (titres statiques visibles, le drawer ne gère pas de collapsed). Pas de theme popover ici — `ThemeSwitcher` actuel reste tel quel dans le drawer.
7. **Documentation** :
   - `CLAUDE.md` ligne 164 : « Sidebar latérale fixe **240px expanded / 64px collapsed** »
   - `DESIGN_SYSTEM.md` : mettre à jour Width (l.196) + ajouter sous-section « Sidebar — Sections & Collapsed » documentant les sections, le toggle, le raccourci, la persistance.
   - `ARCHITECTURE.md` : lister les 4 nouveaux composants + le hook `useSidebarCollapsed`.

## Ce qu'il ne fait PAS
- Ne migre pas les emojis des `NavItem.icon` vers un set d'icônes — c'est un autre chantier.
- Ne touche pas le `MobileDrawer` côté collapsed (les drawers overlay ne se réduisent pas).
- Ne déplace pas le theme switcher dans `/reglages` (option écartée).
- Ne change pas la liste des items (ni href ni label, juste le regroupement).
- Ne touche pas le breakpoint desktop (≥ 900px reste la frontière).
- Ne touche pas `(app)/layout.tsx`.

## Notes techniques
- **Tooltip collapsed** : utiliser `motion.div` avec `whileHover` géré au niveau de chaque `SidebarItem`. Ne PAS utiliser une lib externe (Radix Tooltip etc.) — surcharge inutile.
- **Click-outside popover** : ref + listener `mousedown` sur `document`, retire au unmount. Pattern standard.
- **Animation largeur** : le contenu enfant doit gérer son propre `overflow: hidden` pour éviter le clignotement du label pendant l'animation.
- **localStorage** : prévoir un fallback si bloqué (SSR ou Safari privé) — `try/catch` autour de `getItem`/`setItem`, valeur par défaut `false`.
- **Hydration Next.js** : le hook doit gérer le premier render serveur (`collapsed = false` initial, lecture localStorage dans `useEffect`).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (desktop ≥ 1280px)
- [ ] Sidebar expanded à 240px par défaut au premier reload
- [ ] Clic toggle → sidebar passe à 64px, animation fluide, contenu principal se reflow
- [ ] Reload page → la sidebar reste dans le dernier état (localStorage OK)
- [ ] `Cmd/Ctrl + B` → toggle ; tester avec focus dans un input (`Réglages → recherche staff` par ex.) : doit être **ignoré**
- [ ] En collapsed, hover sur un item → tooltip apparaît à droite avec le label complet
- [ ] Item actif (`/service`) reste visuellement actif dans les deux modes
- [ ] Clic « Apparence » → popover s'ouvre ; clic ailleurs / `Escape` → ferme
- [ ] En collapsed, clic icône Apparence → popover s'ouvre ancré à droite
- [ ] MobileDrawer (resize < 900px) : sections visibles avec titres, ordre cohérent avec desktop
- [ ] Aucun débordement horizontal sur le viewport

### Critères d'acceptation
- [ ] `Sidebar.tsx` ≤ 150 lignes (sinon découper davantage)
- [ ] Aucun composant nouveau > 150 lignes
- [ ] Aucun `useEffect` pour de la data API (rule 5)
- [ ] Tooltip via Framer Motion uniquement, zéro CSS keyframe (rule 12)
- [ ] Tous les commentaires en français (rule 7)
- [ ] `localStorage` lu dans `useEffect` (pas au render — sinon hydration mismatch)
- [ ] `CLAUDE.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md` mis à jour (rule 13)
- [ ] `npm run build` passe sans warning nouveau

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : l'item actif est-il toujours mis en surbrillance dans tous les modes ? Le user row reste-t-il lisible en collapsed ? Y a-t-il un flash d'hydration (sidebar qui s'ouvre/se ferme au premier render) ? Le drawer mobile a-t-il perdu un item ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques :
   - `feat(nav): groupe les items de navigation par sections`
   - `feat(sidebar): largeur 240px + mode collapsed 64px persisté`
   - `feat(sidebar): theme switcher en popover`
   - `refactor(drawer): adopte les sections de navigation`
   - `docs: documente la Sidebar V2`
2. Rapport de vérification (cases cochées + capture expanded/collapsed)
3. Note de risque : hydration mismatch possible sur premier render — à valider avec un hard reload (`Cmd+Shift+R`)
4. Tu push pas. Kévin push.

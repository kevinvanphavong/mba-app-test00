# Refonte breakpoints + burger menu tablette/mobile

> Redéfinir les 3 breakpoints du projet (mobile / tablet / desktop) et remplacer le BottomNav + Sidebar latérale par un Header avec menu burger en dessous de 900px.

## Contexte

Aujourd'hui Shiftly utilise les breakpoints Tailwind par défaut (sm 640 / md 768 / lg 1024 / xl 1280). La Sidebar latérale n'apparaît qu'à partir de `lg:` (≥1024px). En dessous, c'est le `BottomNav` mobile. Kévin veut un système plus simple et plus cohérent :

- 3 devices uniquement : `mobile` (< 500px), `tablet` (500-899px), `desktop` (≥ 900px)
- La Sidebar latérale reste **uniquement** en desktop (≥ 900px)
- Tablette + mobile : un **Header fixe** avec un **bouton burger** ouvre un **drawer** latéral qui affiche les mêmes items de nav que la Sidebar
- Le `BottomNav` actuel est **supprimé** du projet (composant + import + paddings associés)

## Décisions actées

| Sujet | Décision |
|---|---|
| Breakpoints Tailwind | Override total : `screens: { tablet: '500px', desktop: '900px' }`. Plus de `sm/md/lg/xl`. |
| `BottomNav.tsx` | Supprimé. L'unique nav < 900px est le drawer ouvert par le burger. |
| Drawer | Nouveau composant `MobileDrawer.tsx`. Animation Framer Motion (variant `slideUp` adapté en `slideRight`). Fermeture au backdrop click + Escape + clic sur un item. |
| Header burger | Nouveau composant `Header.tsx`. Visible uniquement `< desktop`. Contient logo Shiftly + nom du centre + bouton burger à droite. |
| Audit classes existantes | Mapping mécanique : `lg:` → `desktop:`, `md:` → `tablet:`, `sm:` → `tablet:`, `xl:` → `desktop:`. Tu relis ensuite chaque page pour valider qu'aucun cas borderline ne casse (un `md:` utilisé pour passer à 768px précisément pour le tactile, par exemple). |

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues + section "Navigation par device" à mettre à jour
- `shiftly-app/tailwind.config.ts` — config Tailwind, section `theme.extend` (pas de `screens` aujourd'hui)
- `shiftly-app/src/app/(app)/layout.tsx` — layout racine de l'app (Sidebar + BottomNav + main)
- `shiftly-app/src/components/layout/Sidebar.tsx` — réutiliser la logique nav + user row pour le drawer
- `shiftly-app/src/components/layout/BottomNav.tsx` — à supprimer
- `shiftly-app/src/hooks/useNavItems.ts` — `useDesktopNavItems` et `useMobileNavItems` (à unifier ou conserver selon ce que tu trouves)
- `shiftly-app/src/lib/animations.ts` — variants Framer Motion existants à étendre si besoin

## Tâche

1. **Tailwind config** : dans `tailwind.config.ts`, ajouter `screens: { tablet: '500px', desktop: '900px' }` au niveau `theme` (pas `extend.screens` — c'est un override volontaire). Supprime aucune autre clé.
2. **Audit cross-projet** : `grep -RE "\b(sm|md|lg|xl):" shiftly-app/src` puis mapping :
   - `lg:` et `xl:` → `desktop:`
   - `md:` et `sm:` → `tablet:`
   - Cas litigieux (≥ 768 ≠ 500, ≥ 1024 ≠ 900) : tu listes dans le rapport de livraison et tu demandes confirmation avant push si visuel impacté.
3. **Header burger** : créer `shiftly-app/src/components/layout/Header.tsx` (< 150 lignes). Sticky top, hauteur 56px, `desktop:hidden`. Logo + nom centre à gauche, bouton burger à droite, état ouvert/fermé local + callback ou contexte minimal.
4. **MobileDrawer** : créer `shiftly-app/src/components/layout/MobileDrawer.tsx`. Drawer latéral (slide depuis la gauche), backdrop semi-transparent, animation Framer Motion. Reprend les mêmes items que la Sidebar desktop. Ferme au click backdrop / Escape / sélection d'un item.
5. **Layout refactor** : dans `src/app/(app)/layout.tsx` : virer `BottomNav`, ajouter `Header` + `MobileDrawer`. Remplacer `pb-20 lg:pb-0` du main par le padding-top approprié pour compenser le header sticky en `< desktop`.
6. **Supprimer** `shiftly-app/src/components/layout/BottomNav.tsx` et toutes ses références (grep `BottomNav`).
7. **useNavItems** : unifie en un seul `useNavItems()` qui retourne les items partagés Sidebar/Drawer (la distinction Desktop/Mobile ne sert plus à filtrer puisque le drawer affiche les mêmes items que la sidebar). Vérifie qu'aucun item ne reposait sur le distinguo Desktop vs Mobile (ex : Dashboard caché en mobile).
8. **Docs** : mettre à jour `CLAUDE.md` (section "Navigation par device" + bottom nav), `DESIGN_SYSTEM.md` (breakpoints), `ARCHITECTURE.md` (composants layout : Header + MobileDrawer remplacent BottomNav).

## Notes techniques

- **Risques de régression visuelle** : un `md:flex` (≥ 768) devenant `tablet:flex` (≥ 500) déclenche le layout desktop plus tôt qu'avant. Si une carte/grille assumait > 768px pour s'afficher sur 2 colonnes, elle peut casser à 500px. Audit visuel obligatoire à 500px / 700px / 900px / 1280px.
- **Pas de double déclaration** : ne garde **aucun** alias `md`/`lg` dans `tailwind.config.ts`. L'override doit être total pour purger la dette.
- **Accessibilité drawer** : `role="dialog"` + `aria-modal="true"` + focus trap au minimum sur le bouton fermeture. Pas besoin d'une lib, gérer au clavier avec `useEffect` listener `keydown`.
- **Pas de couleurs hardcodées** dans Header/Drawer (règle 1). Tout passe par `bg-surface`, `border-border`, etc.

## Ce qu'il ne fait PAS

- Pas de redesign des items de nav (icônes, labels, ordre) : on garde l'existant à l'identique.
- Pas de modification de la Sidebar desktop hors `hidden desktop:flex` (la sidebar reste sur 220px, même style).
- Pas de migration vers une lib (Radix, Headless UI) pour le drawer — Framer Motion + un peu de state suffit.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app
npm run lint && npm run build
# Backend non touché : pas de doctrine:schema:validate nécessaire
```

### Tests fonctionnels (manuel, devtools responsive)
- [ ] 320px : Header visible, burger ouvre drawer, items cliquables, pas de Sidebar, pas de BottomNav résiduel
- [ ] 500px : bascule vers le layout tablette (idem mobile : burger + drawer)
- [ ] 700px : Sidebar toujours masquée, Header burger toujours là
- [ ] 900px : Sidebar apparaît, Header burger disparaît, aucun chevauchement
- [ ] 1280px : layout desktop identique à avant la refonte
- [ ] Drawer : ouverture animée, fermeture par backdrop / Escape / clic item
- [ ] Toutes les pages app (`/service`, `/services`, `/postes`, `/staff`, `/tutoriels`, `/reglages`, `/dashboard`, `/pointage`, `/reservations`, `/entreprises`) parcourues aux 4 viewports — aucune mise en page cassée

### Critères d'acceptation
- [ ] `tailwind.config.ts` contient `screens: { tablet: '500px', desktop: '900px' }` au niveau `theme`
- [ ] Aucun `sm:`, `md:`, `lg:`, `xl:` ne subsiste dans `shiftly-app/src` (vérifier `grep -RE "\b(sm|md|lg|xl):" shiftly-app/src` → résultat vide)
- [ ] `BottomNav.tsx` supprimé, aucune référence à `BottomNav` dans le projet
- [ ] Header.tsx et MobileDrawer.tsx < 150 lignes chacun, dans `components/layout/`
- [ ] `CLAUDE.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md` à jour
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (notamment 1, 3, 4, 12)
- [ ] `npm run build` passe sans warning de classes Tailwind unknown

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : un `md:` oublié dans un composant peu visité ? Un `pb-20` orphelin sur une page ? Une page qui pose `lg:grid-cols-3` est devenue `desktop:grid-cols-3` mais le contenu n'est plus lisible à 900px ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques : `chore(tailwind): override screens to tablet/desktop`, `feat(layout): add Header with burger menu`, `feat(layout): add MobileDrawer`, `refactor(layout): remove BottomNav, integrate Header + Drawer`, `chore(audit): replace sm/md/lg/xl with tablet/desktop`, `docs: update breakpoints and layout components`
2. Rapport : liste des fichiers touchés par l'audit, cases cochées, screenshots aux 4 viewports si possible
3. Note de risque : signaler tout cas borderline (ex : un `md:` qui ne mappe pas naturellement vers `tablet:`)
4. Tu push pas. Kévin push.

# Fix page `/postes` — modales tablet/desktop, bouton créer zone, missions par catégorie en tablette

> Sur `/postes` (vue Manager + Employé) : élargir les modales formulaires mission/zone au format tablette/desktop, réduire le padding bottom des modales (navbar bottom retirée), ajouter un bouton « Créer une zone » dans la vue Manager, et faire passer la vue 4 colonnes catégories à 2 colonnes en tablette (mobile reste en liste flat triée par ordre).

## Contexte

- `ModalAddMission` (création + édition) et `ModalAddZone` sont contraints à `max-w-[390px]` → format mobile même sur tablet/desktop. Seul `ModalAddCompetence` est correctement dimensionné (`max-w-[720px]`) → c'est la référence à appliquer aux autres modales.
- Tous les modales bottom-sheet utilisent `pb-20` qui datait de la navbar bottom mobile (now removed). À reduire pour ressembler à un padding cohérent du composant.
- `/postes` (vue Manager) ne permet pas de créer une zone via l'UI alors que `ModalAddZone.tsx` + `useCreateZone()` existent déjà — non wirés.
- En tablette (500-899px), la page affiche `PosteCard` (vue mobile compacte, missions flat) au lieu de la vue 4 colonnes par catégorie. Kévin veut voir les catégories dès la tablette, mais en 2 colonnes (plus 4 c'est trop serré).

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (Tailwind `tablet:`/`desktop:` only, animations Framer Motion)
- `shiftly-app/src/components/editeur/ModalAddCompetence.tsx` — **template de référence** (max-w-[720px], structure)
- `shiftly-app/src/components/editeur/ModalAddMission.tsx` — à élargir (ligne 77)
- `shiftly-app/src/components/editeur/ModalAddZone.tsx` — à élargir (ligne 44) et à wirer
- `shiftly-app/src/components/postes/MissionsBoard.tsx` — grille missions par catégorie (ligne 76 : `grid-cols-4` à adapter)
- `shiftly-app/src/app/(app)/postes/page.tsx` — page à compléter (ajouter état + bouton + modale zone)
- `shiftly-app/src/components/postes/PostesDesktopView.tsx` — bascule responsive ligne 74 (`hidden desktop:flex` → `hidden tablet:flex`)
- `shiftly-app/src/hooks/useZones.ts` — `useCreateZone` déjà dispo ligne 30

## Décisions actées (ne pas remettre en cause)

- **Largeur modales** : toutes les modales du dossier `components/editeur/` (Mission, Zone, Tutoriel, Move, ConfirmDelete) passent à `max-w-[720px]` (= référence ModalAddCompetence).
- **Padding bottom** : `pb-20` → `pb-6 tablet:pb-8`. Conserver `paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'` sur les modales touchables iOS si déjà présent (vérifier dans chaque modale). Si non présent, l'ajouter — sinon l'encoche iPhone mange les boutons.
- **Bouton créer zone** : ajouté dans `/postes`. Visible **manager uniquement**. Placement : en mobile/tablet, à droite de la barre de pills (ligne 140 actuelle de `postes/page.tsx`) ; en desktop, dans le header du `ZoneTabsCarousel` (à voir, fallback : bouton flottant sur la page).
- **Responsive missions par catégorie** :
  - Mobile (< 500px) : `PosteCard` (actuel, liste flat triée par `ordre` croissant — vérifier que le tri est bien appliqué dans `useEditeurMissions`).
  - Tablet (500-899px) : `PostesDesktopView` (`MissionsBoard` 2 colonnes catégories).
  - Desktop (≥ 900px) : `PostesDesktopView` (`MissionsBoard` 4 colonnes — comportement actuel).
- **Renommage** : pas besoin de renommer `PostesDesktopView` en `PostesTabletDesktopView` — c'est cosmétique, on garde le nom actuel mais on ajoute un commentaire en haut du fichier indiquant que la vue est active dès tablette.

## Tâche

1. **Élargir `ModalAddMission.tsx`** ligne 77 : `max-w-[390px]` → `max-w-[720px]`. Profiter pour passer le bloc Catégorie + Fréquence + Priorité en `grid grid-cols-1 tablet:grid-cols-2 gap-3` pour exploiter la largeur supplémentaire en tablet/desktop. Les boutons en bas restent pleine largeur.

2. **Élargir `ModalAddZone.tsx`** ligne 44 : `max-w-[390px]` → `max-w-[720px]`. Le ColorPicker peut tirer parti de la largeur (à laisser tel quel, juste le wrapper change).

3. **Réduire le padding bottom des 6 modales `components/editeur/*.tsx`** : remplace `pb-20` par `pb-6 tablet:pb-8`. Ajoute `style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}` sur le wrapper bottom-sheet si absent. Fichiers concernés : `ModalAddMission`, `ModalAddCompetence`, `ModalAddZone`, `ModalAddTutoriel`, `ModalMoveZone`, `ModalConfirmDelete`.

4. **Bouton créer zone** dans `postes/page.tsx` :
   - Nouvel état : `const [showAddZone, setShowAddZone] = useState(false)`.
   - Mutation : `const createZone = useCreateZone()`.
   - Render le bouton :
     - Vue mobile/tablet ligne 140-163 (barre de pills) : ajouter un bouton `+ Zone` à la fin de la liste, style cohérent avec les pills mais en pointillé (border-dashed) si manager.
     - Vue desktop : à voir, le plus simple = même bouton + en haut à droite du `ZoneTabsCarousel` (ou nouveau bouton dans `PostesDesktopView`).
   - Render la modale `<ModalAddZone open={showAddZone} editZone={null} zones={…} onClose={…} onSave={…} />`.
   - `onSave` : `createZone.mutate({ nom, couleur, ordre: zones.length })`, fermer la modale en `onSuccess`.

5. **`MissionsBoard.tsx` responsive 2 colonnes en tablet** :
   - Ligne 76 : `grid grid-cols-4 gap-0` → `grid grid-cols-2 desktop:grid-cols-4 gap-0`.
   - Bordure entre colonnes : la condition `borderRight: i < COLUMNS.length - 1` ne marche plus en 2 colonnes. Remplacer par un système de bordures CSS plus robuste : `border-r border-b border-border last:border-r-0 desktop:nth-child(4n):border-r-0`. Ajuster pour que la dernière ligne n'ait pas de border-bottom non plus.

6. **Activer `PostesDesktopView` dès tablette** :
   - `PostesDesktopView.tsx` ligne 74 : `hidden desktop:flex` → `hidden tablet:flex`.
   - Inversement dans `postes/page.tsx` ligne 139 : `desktop:hidden` → `tablet:hidden` (la vue `PosteCard` ne s'affiche plus qu'en mobile).
   - Vérifier que les actions manager (`+ Ajouter tâche`, `+ Mission`, drag-drop reorder) restent utilisables sur viewport tablet 768px (les boutons ne doivent pas overflow).

7. **Tri mobile par ordre croissant** : vérifier `useEditeurMissions` (`hooks/useEditeur.ts`) — si le tri n'est pas garanti côté front, ajouter un `.sort((a, b) => a.ordre - b.ordre)` dans `PosteCard.tsx` avant le `.map` ligne 129. Idem pour les compétences si pertinent.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (devtools mobile emulation)
- [ ] **Modales mission/zone à 1280px (desktop)** : la sheet fait bien 720px de large (au lieu de 390px), aérée, lisible. Les 3 selectors Catégorie/Fréquence/Priorité s'organisent en grille 2 cols.
- [ ] **Modales à 375px (mobile)** : largeur 100% viewport (max-w-[720px] n'a aucun effet à cette taille), comportement identique avant le fix.
- [ ] **Padding bottom modales** : à 1280px et à 375px, le bouton « Ajouter » n'est ni trop bas (espace mort) ni mangé par le bord. Sur un iPhone réel (ou simulateur avec safe-area), pas de bouton sous l'encoche.
- [ ] **Bouton « + Zone »** : visible en manager uniquement, ouvre la modale, crée la zone, la zone apparaît dans la liste après mutation, la modale se ferme.
- [ ] **Bouton « + Zone » non visible en employé** (logguer avec un compte EMPLOYE).
- [ ] **Page postes à 768px (tablet)** : on voit `MissionsBoard` (4 catégories) en 2 colonnes 2 lignes, plus `PosteCard`. Lisibilité OK, pas d'overflow des titres catégories.
- [ ] **Page postes à 1280px (desktop)** : 4 colonnes catégories, identique à avant.
- [ ] **Page postes à 375px (mobile)** : `PosteCard` toujours actif, missions affichées en liste flat triée par `ordre` croissant.
- [ ] **Non-régression DnD** : drag d'une mission dans `MissionsBoard` à 768px (2 colonnes) marche et persiste l'ordre.

### Critères d'acceptation
- [ ] Aucune classe `sm:`/`md:`/`lg:`/`xl:` introduite (règle CLAUDE.md "uniquement `tablet:` / `desktop:`")
- [ ] Aucun `any` TypeScript ajouté
- [ ] Aucune couleur hardcodée (toujours `var(--…)` ou tokens Tailwind du design system)
- [ ] `MissionsBoard.tsx` reste < 150 lignes (sinon découper)
- [ ] `postes/page.tsx` reste lisible — si > 250 lignes, extraire l'état zone dans un hook custom
- [ ] `npm run build` passe sans warning bloquant
- [ ] Aucun `useEffect` introduit pour appel API (règle 5)

### Auto-relecture du diff
`git diff main..HEAD` puis relis en hostile :
- Les 6 modales ont-elles TOUTES vu leur `pb-20` remplacé ? (grep `pb-20` → 0 résultat dans `components/editeur/`)
- Le bouton « + Zone » est-il bien gardé manager-only (passer `isManager &&` en condition de render) ?
- Le bord droit des 2 colonnes en tablet est-il correct (pas de bord errant entre la 2e et 3e colonne sur la première rangée) ?
- La modale `ModalAddMission` en tablet/desktop a-t-elle bien la grille 2 cols sans casser le mobile ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. 4-6 commits atomiques (1 par tâche numérotée), format `feat(postes): …` / `style(editeur): …` / `fix(postes): …`.
2. Rapport de vérif : 3 captures (mobile 375 / tablet 768 / desktop 1280) sur la page + 1 capture de la modale mission élargie en desktop + checklist cochée.
3. Note de risque : modifier la responsive condition de `PostesDesktopView` peut révéler des bugs de layout en tablet 768px qui n'étaient jamais testés. Tester drag-drop + reorder mode + bouton « + Ajouter tâche » à cette taille.
4. Tu push pas. Kévin push.

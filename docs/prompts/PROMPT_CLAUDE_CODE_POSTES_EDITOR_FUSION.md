# Refonte /postes — fusion avec /reglages/editeur

> Faire de `/postes` la **vraie page de gestion zones / missions / compétences** (vue manager desktop calquée sur la maquette), et **supprimer la page jumelle `/reglages/editeur`**.

## Contexte

Aujourd'hui `/postes` est en lecture seule et `/reglages/editeur` héberge tout le CRUD (zones, missions, compétences, tutoriels). Les deux écrans manipulent les mêmes données via les mêmes endpoints (`/api/editeur/*`). On consolide tout sur `/postes` avec le nouveau visuel desktop (4 colonnes Ouverture / Pendant / Ménage / Fermeture + panel compétences). Mobile garde l'UX existante (onglets pills + sections empilées).

**Décisions actées avec Kévin** (à ne pas remettre en cause)
- 4 catégories de missions conservées : `OUVERTURE | PENDANT | MENAGE | FERMETURE` → **4 colonnes** desktop (pas 3 comme la maquette).
- **Pas** de badge "Validation manager" sur les compétences (champ `requiresManagerValidation` non créé pour l'instant).
- Onglet `tutoriels` de l'éditeur → reste accessible via le bouton "Voir les tutoriels de cette zone" déjà présent dans `PosteCard` (qui pointe vers `/tutoriels`). Pas de gestion tutoriels dans `/postes`.
- Onglet `staff` de l'éditeur → reste sur `/staff` (déjà séparé).
- Drag-drop reorder : intra-colonne uniquement (pas de cross-catégorie pour l'instant).

## Fichiers à lire avant de coder

- `docs/maquettes/postes-desktop.jsx` — visuel cible desktop (zone tabs grille, panel 4 colonnes, panel compétences)
- `shiftly-app/src/app/(app)/postes/page.tsx` — page actuelle à refondre
- `shiftly-app/src/app/(app)/reglages/editeur/page.tsx` — état ref du CRUD à intégrer + à supprimer ensuite
- `shiftly-app/src/components/editeur/` — `ModalAddMission`, `ModalAddCompetence`, `ModalConfirmDelete` à réutiliser
- `shiftly-app/src/hooks/useEditeur.ts` — hooks existants à compléter
- `shiftly-api/src/Controller/EditeurController.php` — endpoints CRUD déjà disponibles (rien à créer côté back)

## Tâche

### 1. Compléter `shiftly-app/src/hooks/useEditeur.ts`
Ajouter les mutations manquantes (les endpoints existent déjà dans `EditeurController`) :
- `useCreateMission` — `POST /editeur/missions` (note : `useCreateMission` dans `useMissions.ts` tape `/missions/create`, c'est un **autre** endpoint pour le service du jour ; ici on veut celui de l'éditeur)
- `useUpdateMission` — `PUT /editeur/missions/{id}`
- `useDeleteMission` — `DELETE /editeur/missions/{id}`
- `useDeleteCompetence` — `DELETE /editeur/competences/{id}`

Toutes invalident `['missions', centreId, zoneId]` et `['competences', centreId, zoneId]` selon ressource. Typage strict, pas de `any` (règle 2).

### 2. Refondre `shiftly-app/src/app/(app)/postes/page.tsx` (manager only)
- Garder `useManagerGuard` (cf. `editeur/page.tsx`) → un employé qui arrive sur `/postes` est redirigé vers `/dashboard` ou voit un état "lecture seule" (statu quo : redirect).
- **Desktop ≥ lg (`lg:`)** : layout maquette
  - **Carousel horizontal** de cards de zone (1 par zone), 3 à 4 visibles à la fois, scroll horizontal pour le reste. Implémentation : `flex` + `overflow-x-auto` + `scroll-snap-type: x mandatory` sur le conteneur, `scroll-snap-align: start` + `flex-shrink-0` + largeur fixe sur chaque card (calcul : `width: calc((100% - 3 * gap) / 4)` pour viser 4 visibles, `min-w-[260px]` plancher pour rester lisible). **Pas** de `grid-template-columns: repeat(4, 1fr)`.
  - Pas de boutons flèches < > pour l'instant (scroll natif + trackpad/molette suffit). Masquer la scrollbar avec `scrollbar-none` (utility déjà présente dans le projet, cf. `postes/page.tsx` actuel).
  - Chaque card affiche nom + description + `nb missions` + `nb compétences`. Active = bordure couleur zone + fond `${color}14`.
  - Panel "Détail tâches" : header avec nom zone + total + bouton `+ Ajouter tâche` + bouton `↻ Réordonner` (toggle mode reorder).
  - **4 colonnes** (Ouverture / Pendant / Ménage / Fermeture) avec missions triées par `ordre` croissant. Chaque mission affiche `texte`, chip priorité (Vitale/Important/À ne pas oublier), badge `Photo` si `requiresPhoto`, badge `Ponctuelle` si `frequence === PONCTUELLE`, et menu `⋯` (Modifier / Supprimer).
  - Panel "Compétences" en dessous : header zone + bouton `+ Compétence`. Chaque ligne : nom + description + 3 dots niveau (mappés depuis `difficulte` : simple=1, avancee=2, experimente=3) + points + menu `⋯`.
- **Mobile / tablette `< lg`** : conserver l'expérience actuelle (pills horizontaux + `PosteCard` empilé) **+** ajouter les boutons `+ Mission`, `+ Compétence` et menu `⋯` sur chaque ligne pour le manager. Pas de drag-drop sur mobile.
- 3 états (loading / error / empty) par section (règle 6).
- Animations Framer Motion via `fadeUpVariants` (règle 12).

### 3. Câbler les modales
- `ModalAddMission` (existant) — pour create + edit, prop `editMission?` déjà supportée. `onSave` → `useCreateMission` ou `useUpdateMission`.
- `ModalAddCompetence` (existant) — idem.
- `ModalConfirmDelete` (existant) — pour suppression mission + compétence.
- Tous les Modal sont gardés sous le composant page comme dans `editeur/page.tsx`.

### 4. Drag-drop reorder (mode dédié, desktop only)
- `@dnd-kit/core` et `@dnd-kit/sortable` sont déjà installés (cf. `package.json`).
- Toggle `reorderMode` (state local) activé par le bouton `↻ Réordonner`. Quand actif, chaque colonne devient un `SortableContext` (intra-catégorie uniquement).
- À la fin du drop : recalculer le champ `ordre` de chaque mission de la colonne (0..n) et envoyer un `PUT /editeur/missions/{id}` par mission qui a changé d'ordre via `useUpdateMission`. Optimistic update facultatif.

### 5. Supprimer `/reglages/editeur`
- Supprimer `shiftly-app/src/app/(app)/reglages/editeur/page.tsx` et tout `components/editeur/EditorTabs.tsx`, `ZoneList.tsx`, `MissionList.tsx`, `CompetenceList.tsx`, `TutorielList.tsx` **uniquement s'ils ne sont plus utilisés ailleurs** (vérifier avec un grep). Les 5 modales (`ModalAddMission`, `ModalAddCompetence`, `ModalAddZone`, `ModalAddTutoriel`, `ModalConfirmDelete`, `ModalMoveZone`) sont conservées dans `components/editeur/` et réutilisées par `/postes`.
- Si un lien pointe encore vers `/reglages/editeur` (chercher dans `app/`, `components/layout/`), le rediriger vers `/postes`.
- Mettre à jour la table des routes dans `CLAUDE.md` et `ARCHITECTURE.md` (route `/reglages/editeur` supprimée, `/postes` devient page de gestion manager).

### 6. Mise à jour des fichiers de référence (règle 13)
- `ARCHITECTURE.md` : nouvelle composition de `/postes`, suppression `/reglages/editeur`, hooks ajoutés dans `useEditeur.ts`.
- `DESIGN_SYSTEM.md` : si tu introduis un pattern nouveau (ex: card "zone tab"), le documenter.
- `schema.sql` : **rien à toucher** (aucune migration BDD dans ce chantier — la règle 15 ne s'applique pas).

## Ce qu'il ne fait PAS

- Ne touche pas `useMissions.ts` (`useCreateMission` / `useToggleCompletion` / `useCompleteWithPhoto` y restent — ils servent au service du jour, pas à l'éditeur).
- Ne crée aucune migration Doctrine.
- **Pas** de CRUD zones dans ce chantier : on garde les zones telles que seedées en BDD. Si la maquette suggère un bouton "+ Zone", l'omettre. Création/édition de zones = chantier suivant.
- Pas de cross-catégorie en drag-drop (Ouverture → Fermeture interdit pour l'instant).
- Pas de tutoriels dans `/postes` (déjà sur `/tutoriels`).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
# Frontend
cd ../shiftly-app
npm run lint && npm run build
```

### Tests fonctionnels (manager loggué, ≥ 1 zone seedée)
- [ ] Desktop ≥ 1280px : carousel zones affiche 3-4 cards visibles, scroll horizontal pour les suivantes (testé avec ≥ 5 zones seedées). Clic sur une card change la zone active et la couleur du panel.
- [ ] Le scroll-snap aligne les cards proprement (pas de card coupée à mi-chemin après scroll).
- [ ] Le panel détail tâches affiche bien 4 colonnes (Ouverture / Pendant / Ménage / Fermeture) avec missions triées par `ordre`.
- [ ] Bouton `+ Ajouter tâche` ouvre `ModalAddMission` (zone pré-remplie). Submit → la mission apparaît dans la bonne colonne sans refresh.
- [ ] Menu `⋯` sur une mission → "Modifier" → modale pré-remplie ; submit → ligne mise à jour. "Supprimer" → `ModalConfirmDelete` → la ligne disparaît.
- [ ] Bouton `↻ Réordonner` active le drag-drop intra-colonne ; après drop, l'ordre persiste après refresh.
- [ ] Bouton `+ Compétence` ouvre `ModalAddCompetence` ; submit → la compétence apparaît dans le panel.
- [ ] Modifier / supprimer une compétence fonctionne (mêmes patterns).
- [ ] Mobile (< 1024px) : pills + panneaux empilés, boutons `+ Mission` / `+ Compétence` accessibles.
- [ ] Visite `/reglages/editeur` → 404 ou redirect `/postes`.
- [ ] Un employé visite `/postes` → redirigé (ou voit lecture seule). Idem statu quo.

### Critères d'acceptation
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (couleurs via tokens, pas de `any`, pas de `useEffect` API, 3 états par composant, animations FM).
- [ ] Composants nouveaux ≤ 150 lignes (règle 3) — découpe `PostesDesktopView`, `ZoneTabsGrid`, `MissionsBoard`, `CompetencesPanel` si besoin.
- [ ] `npm run build` passe.
- [ ] `doctrine:schema:validate` reste vert (aucune migration créée).
- [ ] `ARCHITECTURE.md` à jour : route `/reglages/editeur` supprimée, page `/postes` documentée comme manager-only.

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Liens orphelins vers `/reglages/editeur` ?
- `useCreateMission` de `useMissions.ts` toujours utilisé par `service/page.tsx` (pas écrasé) ?
- `PosteCard` mobile encore fonctionnel pour les employés ?
- Drag-drop ne casse pas si `@dnd-kit` n'est pas chargé sur SSR (`'use client'` en haut) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques (convention `type(scope): summary`) :
   - `feat(editeur): add useUpdate/useDelete mission + competence hooks`
   - `feat(postes): desktop redesign with 4-column board`
   - `feat(postes): wire create/edit/delete modals`
   - `feat(postes): drag-drop reorder via dnd-kit`
   - `chore(editeur): remove /reglages/editeur page (replaced by /postes)`
   - `docs: update ARCHITECTURE for postes/editeur fusion`
2. Rapport de vérification (cases cochées + screenshots desktop + mobile).
3. Note de risque : tester le carousel zones avec 2 zones (pas de scroll inutile), 4 zones (limite affichable), 6+ zones (scroll franc). Vérifier que le scroll-snap n'empêche pas le clic sur les cards à demi-cachées.
4. Tu push pas. Kévin push.

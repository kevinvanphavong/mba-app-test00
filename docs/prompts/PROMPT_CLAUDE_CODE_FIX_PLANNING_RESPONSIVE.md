# Fix responsive de la page `/planning` (vue Manager)

> Corriger 4 défauts CSS responsive sur la vue Manager du Planning hebdo : layout des KPIs, ordre toolbar mobile/tablet, sticky horizontal du header `Employés`, et compactage de la colonne employé en mobile.

## Contexte

Sur `/planning` (vue Manager), Kévin a relevé 4 problèmes responsive :
- Les 4 KPIs de la carte « Planning hebdomadaire » s'écrasent en tablette (forcés sur une seule ligne avec `flex-1`).
- Zones (légende) et boutons d'action de la toolbar restent sur la même ligne en tablette ; en mobile ils sont sur 2 lignes mais dans le mauvais ordre (zones puis boutons, on veut boutons puis zones).
- Le `<TH>` « Employés » du tableau planning n'est PAS sticky horizontalement alors que la cellule employé de chaque ligne l'est → quand on scroll horizontalement, le header se barre et la colonne reste.
- En mobile, la colonne employé fait `w-[200px]` (trop large). On veut `w-[140px]` + nom format « Prénom N. » au lieu du seul prénom + masquer le type de contrat et la barre de progression heures.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues, en particulier la règle "uniquement `tablet:` / `desktop:`, jamais `sm:` `md:` `lg:`"
- `DESIGN_SYSTEM.md` — breakpoints Shiftly (mobile < 500px, tablet 500-899px, desktop ≥ 900px)
- `shiftly-app/src/components/planning/PlanningManagerView.tsx` — KPIs ligne 220-232 + toolbar ligne 237-306
- `shiftly-app/src/components/planning/PlanningGrid.tsx` — header tableau ligne 174-185 (TH « Employés » à rendre sticky horizontalement)
- `shiftly-app/src/components/planning/PlanningRow.tsx` — colonne employé sticky ligne 126-167 (à compacter en mobile)

## Décisions actées (ne pas remettre en cause)

- **Mobile employé** : format « Prénom N. » (ex : « Kevin V. »), initiales 2 lettres conservées (« KV »), largeur colonne `140px` en mobile / `200px` à partir de tablet. Type de contrat + bloc heures/progression `hidden tablet:flex` (masqués en mobile).
- **KPIs** : grid 2x2 en mobile, `flex-wrap` en tablet, ligne unique en desktop (comportement actuel).
- **Toolbar mobile/tablet** : 2 lignes, **Boutons en haut, Zones en bas**. En desktop : ligne unique avec zones à gauche + boutons à droite (comportement actuel).

## Tâche

1. **KPIs** (`PlanningManagerView.tsx` ~ligne 224 + composant `KpiBox` ligne 38) : remplacer le `flex items-stretch gap-2` du bloc droite par une `grid grid-cols-2 gap-2 tablet:flex tablet:flex-wrap tablet:gap-3 desktop:flex-nowrap`. Adapter `KpiBox` et le bloc Statut en conséquence (retirer `flex-1`, ajouter `min-w-0`). Tester aussi à 320px de largeur.

2. **Toolbar zones+boutons** (`PlanningManagerView.tsx` ligne 237) : changer le wrapper en `flex flex-col-reverse gap-3 desktop:flex-row desktop:items-center desktop:justify-between`. Garde l'ordre DOM actuel (zones en premier, boutons après) — `flex-col-reverse` inverse pour mobile/tablet sans casser le desktop.

3. **TH Employés sticky horizontal** (`PlanningGrid.tsx` ligne 177-179) : ajouter `style={{ position: 'sticky', left: 0, zIndex: 6 }}` sur la cellule `<div className="flex w-[200px] shrink-0…">`. Le wrapper ligne 176 a déjà `position:sticky, top:0, zIndex:5` (sticky vertical) — le nouveau z-index 6 garantit que la cellule top-left reste au-dessus de la colonne employé sticky (z 4) et du header de jour sticky (z 5).

4. **Colonne employé compacte mobile** :
   - `PlanningRow.tsx` ligne 127 : `w-[200px]` → `w-[140px] tablet:w-[200px]`. Idem ligne 177 de `PlanningGrid.tsx` (le header doit matcher la largeur).
   - Ligne 148-151 : afficher `{employee.prenom} {employee.nom.charAt(0).toUpperCase()}.` au lieu de `{employee.prenom ?? employee.nom}` (fallback : si pas de prenom, garder l'ancien comportement).
   - Ligne 152-154 (type contrat) et ligne 156-166 (bloc heures + barre) : ajouter `hidden tablet:flex` (ou équivalent selon le wrapper) pour masquer en mobile.
   - Vérifier que la poignée de tri ⠿ et l'avatar restent visibles en mobile.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels (DevTools mobile emulation)
- [ ] À 375px (iPhone) : KPIs en grid 2x2, toolbar boutons au-dessus / zones en-dessous, colonne employé ~140px avec « Kevin V. » + « KV », pas de type contrat ni barre heures visible.
- [ ] À 768px (tablet) : KPIs en flex-wrap (peuvent passer sur 2 lignes si serrés), toolbar boutons au-dessus / zones en-dessous, colonne employé 200px avec type contrat + barre heures.
- [ ] À 1280px (desktop) : layout inchangé (KPIs sur 1 ligne, toolbar zones à gauche / boutons à droite, colonne employé 200px).
- [ ] Sur mobile + tablette : scroller horizontalement la grille → le header « EMPLOYÉS » reste collé à gauche, seul l'en-tête des jours scrolle dessous.
- [ ] Drag d'une ligne / drag d'un shift : aucune régression du DnD existant.

### Critères d'acceptation
- [ ] Aucune classe `sm:` / `md:` / `lg:` / `xl:` introduite (règle CLAUDE.md "uniquement `tablet:` / `desktop:`")
- [ ] Aucun `any` TypeScript ajouté
- [ ] Aucune couleur hardcodée (toujours `var(--…)`)
- [ ] Composants restent < 150 lignes (déjà OK, juste à vérifier qu'on ne dépasse pas)
- [ ] `npm run build` passe sans warning bloquant

### Auto-relecture du diff
`git diff main..HEAD` puis relis en hostile :
- Le z-index 6 du TH ne casse-t-il pas l'overlay du `<DragOverlay>` ? (Vérifier visuellement un drag de shift par-dessus la colonne sticky.)
- Le `flex-col-reverse` perturbe-t-il la tab order accessibilité ? Si oui, garder l'ordre DOM logique avec `order-` Tailwind à la place.
- La largeur 140px tient-elle « Kevin V. » + heures avatar + poignée ⠿ sans truncate moche ? Si tight, descendre à `w-[150px]` mobile.

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. 4 commits atomiques (un par fix), format `fix(planning): <résumé>` ou `style(planning): <résumé>`.
2. Rapport de vérif : 3 captures (mobile 375 / tablet 768 / desktop 1280) + checklist cochée.
3. Note de risque : DnD + sticky cumulé (top + left) peuvent interagir bizarrement sur certains navigateurs — tester Chrome + Safari iOS.
4. Tu push pas. Kévin push.

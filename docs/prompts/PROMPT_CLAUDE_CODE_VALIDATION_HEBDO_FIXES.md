# Validation hebdo — lot 1 : bugs, UX critique, nav clavier

> Corrige 9 problèmes accumulés sur `/pointage/validation` (timezone, multi-pointages, UX, z-index, navigation clavier, cohérence visuelle).

## Contexte
Page manager utilisée chaque lundi pour relire et valider les heures de la semaine précédente.
Plusieurs frictions empêchent un usage propre : décalage 2h entre Pointage et Validation hebdo, impossibilité de corriger plus d'un pointage par employé, modale `confirm()` native, pas de toast, navbar mobile qui passe au-dessus du formulaire de correction, et aucun raccourci clavier pour enchaîner les validations.

## Fichiers à lire avant de coder
- `shiftly-app/src/app/(app)/pointage/validation/page.tsx` — point d'entrée + handler `confirm()` à remplacer
- `shiftly-app/src/components/validation/ValidationEmployeeDetail.tsx` — bouton "Corriger" hardcodé sur jour 0
- `shiftly-app/src/components/validation/ValidationDayCell.tsx` — affichage heures (consomme la chaîne back)
- `shiftly-app/src/components/validation/ValidationTable.tsx` — couleur écart + cible nav clavier
- `shiftly-app/src/components/validation/ValidationWeekControl.tsx` — code mort `dimanche` + calcul `labelFin`
- `shiftly-api/src/Service/ValidationHebdoService.php` — `?->format('H:i')` partout (cause du bug timezone)
- `shiftly-app/src/components/pointage/PointageStaffCard.tsx` — pattern `formatHeure(iso)` à reproduire

## Tâche

### 1. Bug timezone — Validation hebdo affiche UTC au lieu d'Europe/Paris
- Dans `ValidationHebdoService.php`, remplace tous les `?->format('H:i')` (lignes 251, 252, 267, 285, 286 et `formatPauses()` ligne ~741) par un format ISO complet : `?->format(\DateTimeInterface::ATOM)`. Pareil pour `resolveFinPointage()` dont `fin->format('H:i')` (ligne 252) doit aussi devenir ISO.
- Côté front, dans `ValidationDayCell.tsx` et `ValidationEmployeeDetail.tsx`, ajoute un util `formatHeure(iso: string): string` identique à celui de `PointageStaffCard.tsx:25-27` (`new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })`) et applique-le à toutes les valeurs `heureArrivee` / `heureDepart` / `pauses[].debut|fin` venant du back. Met-le en util partagé `shiftly-app/src/lib/formatHeure.ts` pour éviter la duplication.

### 2. Bouton "Corriger" multi-pointages
Dans `ValidationEmployeeDetail.tsx` :
- Supprime le bouton "✏️ Corriger" du footer (lignes ~186-206).
- Dans la boucle `joursActifs.map(...)` (~ligne 77), ajoute à droite de chaque ligne (à côté de `heuresNettes`) un bouton ✏️ discret, **affiché uniquement si `jour.pointageId !== null`**, qui setState `correctionPointageId` + `correctionDate` du jour cliqué et ouvre le formulaire.
- Le formulaire reste affiché en bas (state inchangé), il s'ouvre simplement pré-rempli sur le bon jour.

### 3. Code mort + calcul tordu — `ValidationWeekControl.tsx:34-38`
- Remplace `const dimanche = addWeeks(currentLundi, 1)` (qui n'est PAS dimanche) par `const dimanche = addDays(currentLundi, 6)` (importer `addDays` de `date-fns`).
- Remplace le calcul `labelFin` par `format(dimanche, 'd MMM yyyy', { locale: fr })`.

### 4. Couleur d'écart positif — `ValidationTable.tsx:78`
- `const ecartClass = employe.ecart > 0 ? 'orange' : employe.ecart < 0 ? 'red' : 'green'`
- Ajoute la classe CSS `orange` dans `globals.css` si elle n'existe pas pour `.validation-total-cell.orange` (couleur `var(--accent)`).
- Justification : un écart positif = heures sup à payer, c'est un signal d'attention budget, pas une bonne nouvelle.

### 5. `confirm()` natif — `page.tsx:91`
Remplace l'appel `confirm(...)` par une vraie modale du design system. Réutilise un composant modal existant (cf. `DESIGN_SYSTEM.md` et autres usages déjà présents dans le code, ex. `PublishModal`, `TemplatesModal`). Si aucun composant `ConfirmModal` partagé n'existe, crée-en un dans `shiftly-app/src/components/ui/ConfirmModal.tsx` (max 80 lignes, props `open / title / message / onConfirm / onCancel / variant: 'danger' | 'default'`).

### 6. Toast après mutation
Dans `page.tsx`, branche `useToastStore` (existe déjà : `shiftly-app/src/store/toastStore.ts`) sur les mutations `validerEmployeMut`, `validerSemaineMut`, `devaliderSemaineMut`, `corrigerMut` :
- success → toast vert ("Employé validé", "Semaine validée", "Correction appliquée"...)
- error → toast rouge avec le message d'erreur API.
Utilise `onSuccess` / `onError` côté hook OU directement via `mut.mutate(args, { onSuccess, onError })` à l'appel.

### 7. z-index navbar mobile vs formulaire de correction
Dans `globals.css:574`, la classe `.validation-mobile-modal` est en `z-index: 50` — exactement comme la `BottomNav` (`z-50` dans `BottomNav.tsx:11`). La navbar passe au-dessus.
- Passe `.validation-mobile-modal` à `z-index: 60` dans `globals.css`.
- Vérifie qu'aucun autre overlay (`PhotoLightbox`, `StaffPreviewModal`, etc.) n'utilise déjà 60 ; sinon ajuste pour rester cohérent.

### 8. Cohérence visuelle — bouton "Tout dévalider"
Dans `page.tsx` (~ligne 132-146), le bouton "Tout dévalider" a aujourd'hui `background: 'transparent'` ce qui le détache visuellement de la zone tableau. Pour cohérence avec le header du tableau (`globals.css:494` : `.validation-table th { background: var(--surface2); ... }`), passe le `background` du bouton à `var(--surface2)`. Le reste (couleur texte / bordure rouge) reste inchangé. Idem pour l'état hover si défini : doit rester lisible avec ce nouveau fond.

### 9. Navigation clavier dans le tableau
Dans `ValidationTable.tsx` :
- Quand un employé est sélectionné (`selectedUserId !== null`), capture les touches `ArrowDown` / `ArrowUp` au niveau du document (`useEffect` + `addEventListener('keydown')`, cleanup propre).
- ↓ → sélectionne le `userId` de l'employé suivant dans `employes`. ↑ → précédent. Boucle aux extrémités.
- `Enter` → déclenche la validation de l'employé sélectionné (équivalent du clic sur "✓ Valider" dans `ValidationEmployeeDetail`). Ne fait rien si l'employé est déjà `VALIDEE` ou si la mutation est `isPending`.
- Ne pas capturer si le focus est sur un `<input>`, `<textarea>` ou `<select>` (sinon ça casse le formulaire de correction).
- Hook le tout via une nouvelle prop `onValiderSelected?: () => void` passée depuis `page.tsx`, qui appelle `handleValiderEmploye(selectedUserId)`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
cd shiftly-api && php bin/console doctrine:schema:validate && php bin/console lint:container
# Frontend
cd ../shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Sur `/pointage/validation`, l'heure d'arrivée affichée est **identique** à celle de `/pointage` (au pic d'utilisation = heure d'été = +2h).
- [ ] Sélectionner un staff avec ≥ 2 pointages dans la semaine → cliquer ✏️ sur lundi puis sur jeudi → le formulaire pré-remplit le bon `pointageId` à chaque fois (vérifier dans la requête réseau).
- [ ] Sur `ValidationWeekControl`, la plage de dates affichée va bien **lundi → dimanche** (pas lundi → lundi+7).
- [ ] Un staff avec écart `+5h` s'affiche en **orange** ; `-3h` en **rouge** ; `0h` en **vert**.
- [ ] "Tout dévalider" ouvre la modale custom du design system, plus jamais le `confirm()` natif.
- [ ] Après validation d'un employé, un toast vert apparaît. Idem correction et "Tout valider".
- [ ] En mobile, ouvrir le panneau détail + le formulaire de correction → la BottomNav est **derrière**, le formulaire est **devant**.
- [ ] Cliquer sur un staff, presser ↓ → l'employé suivant est surligné. Presser ↑ → on remonte. Presser Entrée → l'employé sélectionné est validé (toast confirme).
- [ ] Pendant la frappe dans le `<input type="time">` du formulaire de correction, ↑/↓ ne change PAS la sélection d'employé.
- [ ] Le bouton "Tout dévalider" a le même fond `var(--surface2)` que le header `<th>` du tableau (alignement visuel évident à l'œil).

### Critères d'acceptation
- [ ] Aucun `?->format('H:i')` ne subsiste dans `ValidationHebdoService.php`.
- [ ] `formatHeure` est défini une seule fois (util partagé), réutilisé en 3 endroits min.
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (pas de `any`, pas de couleur hardcodée, max 150 lignes par composant).
- [ ] `npm run build` + `doctrine:schema:validate` passent.

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : un `format('H:i')` oublié quelque part ? un `z-index` cassant un autre overlay ? le `useEffect` de capture clavier sans cleanup ? le bouton ✏️ qui s'affiche sur les jours `repos` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Un commit par tâche numérotée (ex : `fix(validation): timezone — back renvoie ISO, front formate en local`). 9 commits atomiques.
2. Rapport : cases cochées + capture/output `npm run build`.
3. Note de risque : tester en priorité avec une fixture qui contient ≥ 2 pointages dans la semaine pour le même staff.
4. Tu push pas. Kévin push.

# Refonte du formulaire membre — Variante 4 (deux colonnes en cartes)

> Remplacer le bottom-sheet pleine largeur de `ModalEditStaff` par une modale centrée 720px, organisée en deux colonnes de cartes titrées.

## Contexte

`ModalEditStaff` est aujourd'hui un bottom-sheet pleine largeur, longue colonne unique de champs en placeholder-only. Kévin a validé une refonte : **bottom-sheet collé en bas** (même patron que le formulaire « Nouveau shift »), centré, largeur 720px, deux colonnes de cartes titrées, vrais labels, footer d'actions séparé. La maquette `staff-form-variants.html` montre le rendu cible exact — **se référer à la Variante 4 uniquement** (la dernière du fichier).

C'est une refonte d'organisation : **tous les champs, la logique de chargement, la validation et le contrat `onSave` restent identiques**. Seuls le layout et l'habillage changent.

## Fichiers à lire avant de coder

- `docs/maquettes/staff-form-variants.html` — Variante 4 = rendu cible (bottom-sheet, cartes, labels, footer, champ PIN)
- `shiftly-app/src/components/staff/ModalEditStaff.tsx` — composant à refondre (état, useEffect, handleSubmit, validation)
- `shiftly-app/src/components/planning/ShiftModal.tsx` — **patron de coquille** : bottom-sheet ancré en bas, `mx-auto max-w-[...]`, poignée, animation Framer Motion (`sheetVariants` / `backdropVariants`)
- `shiftly-app/src/lib/colors.ts` — `AVATAR_PALETTE`, `getGradientFromColor` (déjà importés)

## Tâche

1. **Coquille de modale** — reprendre **exactement le patron de `ShiftModal.tsx`** : bottom-sheet ancré en bas (`fixed inset-x-0 bottom-0`), centré horizontalement et borné en largeur (`mx-auto max-w-[720px]` — au lieu du `480px` de ShiftModal), `rounded-t-[24px]`, bordure, poignée en haut, backdrop sombre, animation Framer Motion (`sheetVariants` / `backdropVariants` + `AnimatePresence`). Conserver `max-h-[90vh] overflow-y-auto`. Sous 720px de viewport, le sheet occupe naturellement toute la largeur.
2. **En-tête** — titre (`Modifier le membre` / `Nouveau membre`) + sous-titre (nom du membre · nom du centre), bouton fermer à droite.
3. **Corps en deux colonnes de cartes** — grille 2 colonnes sur tablette+, repli en 1 colonne sous `tablet:`. Cartes (cf. maquette V4) :
   - Colonne gauche : **Identité & compte** (prénom/nom sur une ligne, email/mot de passe sur une ligne, rôle en segmented) ; **Avatar** (preview + palette 6 colonnes).
   - Colonne droite : **Contrat** (chips type + heures/semaine + date d'embauche) ; **Équipement** (haut/bas/pointure) ; **Accès & statut** (code PIN + toggle Membre actif).
4. **Vrais labels** — chaque champ reçoit un label au-dessus (au lieu du placeholder seul). Marquer `*` les champs requis (Nom, Email, et Mot de passe en création).
5. **Footer d'actions séparé** — barre en bas, bordure haute, boutons `Annuler` (ferme) et `Enregistrer` / `Créer le membre`. Reprendre la condition `disabled` existante.
6. **Champ PIN** — rester un `<input>` unique (comportement actuel inchangé : filtre non-chiffres, max 4, code pré-rempli en édition, message jaune si 1-3 chiffres). Le styliser large/espacé comme dans la maquette. Pas de bouton Régénérer.
7. **Statut « Membre actif »** — uniquement en édition (`member` non nul), dans la carte Accès & statut.
8. **Découpage (règle 3)** — le composant dépassera 150 lignes : extraire les cartes en sous-composants **présentationnels** dans `components/staff/` (ex. un composant par carte). L'état (`useState`) et `handleSubmit` restent dans `ModalEditStaff` ; les sous-composants reçoivent `value` + `onChange`, aucune logique métier (règle 8).

## Notes techniques

- Préfixes Tailwind autorisés : **uniquement `tablet:` et `desktop:`** (pas de `sm:`/`md:`/`lg:`).
- Règle 1 : aucune couleur hardcodée — tokens (`bg-surface`, `bg-surface2`, `border-border`, `text-accent`…).
- Le contrat `onSave(SaveData)` ne change pas : mêmes clés, même typage, aucun `any`.
- Conserver toute la validation existante : Nom + Email requis, Mot de passe requis en création, `codePointage` accepté seulement si 4 chiffres.
- Animation : reprendre les variants Framer Motion de `ShiftModal.tsx` (sheet qui monte du bas + fondu du backdrop). Aucune keyframe CSS (règle 12).

## Ce qu'il ne fait PAS

- Aucun nouveau champ, aucune suppression de champ.
- Pas de bouton Régénérer le PIN, pas de composant OTP à 4 cases.
- Pas de changement côté API, hook `useStaff` ou types.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Desktop : bottom-sheet collé en bas, centré, largeur 720px, deux colonnes de cartes
- [ ] Mobile (< 500px) : le sheet occupe toute la largeur, cartes empilées en une colonne
- [ ] Création d'un membre : tous les champs, validation (Nom/Email/Mdp requis), enregistrement OK
- [ ] Édition d'un membre : champs pré-remplis, code PIN affiché, toggle « Membre actif » présent
- [ ] PIN : refuse les non-chiffres, bloque à 4, message jaune si 1-3 chiffres
- [ ] Choix d'une couleur d'avatar : la preview se met à jour

### Critères d'acceptation
- [ ] `ModalEditStaff` et chaque sous-composant ≤ 150 lignes (règle 3)
- [ ] Aucun sous-composant ne contient de logique métier (règle 8)
- [ ] Contrat `onSave` inchangé, aucun `any`, aucun préfixe `sm:`/`md:`/`lg:`
- [ ] `npm run build` passe

### Auto-relecture du diff
`git diff` relu en hostile : la validation `disabled` du bouton est-elle bien identique à l'avant ? le `useEffect` de chargement remplit-il toujours tous les champs ? régression sur l'ouverture en création (champs vides + `codePointage` à `0000`) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques (`refactor(staff): ...`, `style(staff): ...`).
2. Rapport de vérification (cases cochées + preuves).
3. Tu push pas. Kévin push.

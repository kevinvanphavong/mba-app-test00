# Planning — note manager sur shift + édition d'absence par formulaire

> Ajouter une note libre par shift (saisie manager, visible staff) et remplacer la suppression d'absence au clic par une modale d'édition (type + motif).

## Contexte
Le manager veut pouvoir annoter un shift (« arrive à 11h pour la livraison ») et que le staff voie cette note sur sa page planning. Par ailleurs, cliquer sur un bloc absence la **supprime** directement (croix + onClick dans `AbsenceBlock.tsx`) : trop dangereux. On veut qu'un clic ouvre un formulaire d'édition (type d'absence + motif, champs déjà existants), la suppression passant par un bouton explicite dans cette modale.

## Fichiers à lire avant de coder
- `shiftly-api/src/Entity/Poste.php` — entité à enrichir (pas de champ note)
- `shiftly-api/src/Service/PlanningService.php` — sérialisation week (manager) + employee (staff)
- `shiftly-api/src/Controller/AbsenceController.php` — POST L29 / DELETE L85, pas de PATCH
- `shiftly-app/src/components/planning/ShiftModal.tsx` — formulaire shift (création/édition)
- `shiftly-app/src/components/planning/AbsenceBlock.tsx` + `AbsenceModal.tsx` — à transformer
- `shiftly-app/src/components/planning/PlanningRow.tsx` — câblage onDelAbsence à remplacer
- `shiftly-app/src/components/planning/EmployeeShiftRow.tsx` — affichage staff

## Décisions actées (ne pas remettre en cause)
| Décision | Choix |
|---|---|
| Note shift | Champ `note` nullable (TEXT, max 500 car.) sur `Poste`, pas une entité dédiée |
| Suppression absence | Retirée du bloc ; bouton « Supprimer l'absence » dans la modale d'édition, avec confirmation |
| Modale absence | `AbsenceModal` passe en mode dual création/édition (comme `ShiftModal`), pas de 2e composant |

## Tâche

### A — Note sur shift
1. `Poste.php` : ajoute `note` (string nullable, length 500) + getter/setter + groupes de sérialisation pour que le PATCH merge-patch existant (`/postes/{id}`) l'accepte. Migration — **règle 15 du CLAUDE.md** (MySQL ET PostgreSQL).
2. `CreatePosteController.php` : accepte `note` optionnelle (trim, max 500, sinon 400).
3. `PlanningService.php` : expose `note` dans les payloads shift des vues **manager** (`/planning/week`) et **staff** (`/planning/employee`). Propage la note dans `duplicateWeek()` et dans les templates (`PlanningTemplateShift` : nouveau champ + capture + apply — même migration).
4. Front manager : `note` dans `PlanningShift`/`CreateShiftPayload`/`UpdateShiftPayload` (`types/planning.ts`), textarea « Note (facultatif) » dans `ShiftModal.tsx` (schéma Zod max 500), indicateur discret 📝 sur `ShiftBlock.tsx` si note présente (tooltip au survol).
5. Front staff : `note` dans `EmployeeShift`, affichée sous la ligne zone/horaires dans `EmployeeShiftRow.tsx` (texte `--muted`, petite taille, multi-lignes OK).

### B — Édition d'absence par formulaire
6. `AbsenceController.php` : ajoute `PATCH /planning/absence/{id}` (body `{ type?, motif? }`) — validation type dans l'enum existant, motif nullable, mêmes contrôles centre/voter que le DELETE.
7. `usePlanning.ts` : hook `useUpdateAbsence` (invalidation des mêmes query keys que create/delete).
8. `AbsenceModal.tsx` : mode édition — prop `absence?: PlanningAbsence | null` ; si définie, pré-sélectionne le type, pré-remplit le motif, titre « Modifier l'absence », bouton « Enregistrer », et bouton secondaire rouge « Supprimer l'absence » (confirmation en 2 temps dans la modale, pas de `window.confirm`).
9. `AbsenceBlock.tsx` : retire la croix ✕ et le `onDelete` ; le clic appelle `onEdit` (curseur pointer conservé). Met à jour le câblage dans `PlanningRow.tsx` / `PlanningManagerView.tsx` (`onDelAbsence` → `onEditAbsence`).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
# Backend
php bin/console doctrine:schema:validate
php bin/console lint:container
# Frontend
npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Créer un shift avec note → visible dans ShiftModal en réédition + 📝 sur le bloc
- [ ] Note > 500 caractères → erreur Zod front ET 400 back (curl)
- [ ] Connecté en EMPLOYE : la note apparaît sur la page planning staff (semaine publiée)
- [ ] Dupliquer semaine + appliquer template → notes conservées
- [ ] Clic sur un bloc absence → modale pré-remplie ; changer CP → MALADIE + motif → sauvegardé
- [ ] Supprimer une absence uniquement via le bouton de la modale, avec confirmation
- [ ] Curl PATCH absence d'un autre centre → 403 (isolation multi-tenant)

### Critères d'acceptation
- [ ] Plus aucun chemin de suppression d'absence au simple clic
- [ ] `AbsenceModal.tsx` ≤ 150 lignes (découper si dépassement)
- [ ] Migration rejouée sur MySQL ET PostgreSQL sans erreur (règle 15)
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] `npm run build` + `doctrine:schema:validate` passent

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : la note fuite-t-elle dans des payloads où elle n'a rien à faire (export PDF, snapshots) ? Le snapshot publié (vue staff) inclut-il bien la note ? Régression sur le flux création d'absence ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par bloc (A puis B), messages `type(scope): summary`
2. Rapport de vérification (cases cochées + preuves)
3. Note de risque : si la vue staff lit le **snapshot publié**, la note n'apparaîtra qu'après republication — le signaler
4. Tu push pas. Kévin push.

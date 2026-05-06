# Validation hebdo — corriger les heures de pause

> Étend le formulaire de correction pour modifier `pauseDebut` et `pauseFin` d'une pause spécifique d'un pointage.

## Contexte
Le type `CorrectionPayload.champModifie` accepte déjà `'pauseDebut' | 'pauseFin'` et l'entité `CorrectionPointage::CHAMPS` les liste, mais : (a) le `<select>` du formulaire ne propose que arrivée/départ, (b) le `match()` de `corrigerPointage()` ne gère pas les pauses (il enregistre la correction mais ne modifie pas la `PointagePause`). Un pointage peut avoir plusieurs pauses → il faut un `pauseId` pour savoir laquelle viser.

⚠️ À faire **après** le merge du lot 1 (`PROMPT_CLAUDE_CODE_VALIDATION_HEBDO_FIXES.md`) : ce prompt touche les mêmes fichiers (formulaire de correction + `ValidationHebdoService`).

## Fichiers à lire avant de coder
- `shiftly-api/src/Service/ValidationHebdoService.php` — `corrigerPointage()` (~ligne 645) + `formatPauses()` (~ligne 731)
- `shiftly-api/src/Entity/PointagePause.php` — getters / setters debut + fin
- `shiftly-app/src/types/validation.ts` — `ValidationPause`, `CorrectionPayload`
- `shiftly-app/src/components/validation/ValidationEmployeeDetail.tsx` — boucle pauses (~ligne 91)
- `shiftly-app/src/components/validation/ValidationCorrectionForm.tsx` — `<select>` champ + payload

## Tâche

### Back
1. Dans `formatPauses()`, ajoute `'id' => $pause->getId()` à chaque pause exposée. Adapte aussi le type `ValidationPause` côté front pour inclure `id: number`.
2. Dans `corrigerPointage()` :
   - Ajoute un paramètre optionnel `?int $pauseId = null` à la signature.
   - Si `$champ` vaut `'pauseDebut'` ou `'pauseFin'`, exige `$pauseId`. Sinon `\InvalidArgumentException`.
   - Charge la `PointagePause` via le repo, vérifie qu'elle appartient bien au `$pointage` (sinon erreur 400).
   - Étend les `match()` `$ancienneValeur` et application pour gérer `pauseDebut → $pause->getHeureDebut()` / `setHeureDebut()` et `pauseFin → $pause->getHeureFin()` / `setHeureFin()`.
   - Persiste la `PointagePause` modifiée + flush.
3. Dans `ValidationController::corrigerPointage` (~ligne 222), accepte `pauseId` dans le body JSON et passe-le au service.
4. Dans l'entité `CorrectionPointage`, ajoute un champ optionnel `?int $pauseId` (nullable) + migration Doctrine pour persister la cible exacte de la correction (utile à l'audit). **Règle 15 du CLAUDE.md** : vérifier compatibilité MySQL/PostgreSQL de la migration avant commit (pas de SQLite).

### Front
5. Étends `CorrectionPayload` (`types/validation.ts`) : ajoute `pauseId?: number`.
6. Dans `ValidationCorrectionForm.tsx` :
   - Ajoute un nouveau prop optionnel `pauseId?: number` (passé par le parent).
   - Étends la constante `CHAMPS` avec `{ value: 'pauseDebut', label: 'Début de pause' }` et `{ value: 'pauseFin', label: 'Fin de pause' }` — ces deux options ne s'affichent que si `pauseId` est défini.
   - Ajoute `pauseId` au payload émis quand le champ choisi est une pause.
7. Dans `ValidationEmployeeDetail.tsx`, sur la ligne de chaque pause (~ligne 91-96), ajoute un petit bouton ✏️ qui ouvre le formulaire avec `correctionPointageId = jour.pointageId` et `correctionPauseId = pause.id`. Idem nouveau state `correctionPauseId` à passer au form.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api && php bin/console doctrine:schema:validate && php bin/console doctrine:migrations:migrate --no-interaction --env=test
cd ../shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Sur un staff avec pause(s) dans la semaine, le bouton ✏️ apparaît à droite de chaque pause dans le panneau Détail.
- [ ] Cliquer ✏️ sur la pause de lundi → le formulaire s'ouvre avec "Début de pause" / "Fin de pause" disponibles dans le select.
- [ ] Modifier "Début de pause" puis Appliquer → en BDD, c'est bien la `PointagePause` ciblée qui est mise à jour (pas une autre pause du même pointage).
- [ ] Une `CorrectionPointage` est créée avec `champModifie='pauseDebut'` et `pauseId` rempli.
- [ ] L'historique de corrections affiche bien la modif (ligne ~150 de `ValidationEmployeeDetail.tsx`).
- [ ] Tenter d'envoyer `champModifie='pauseDebut'` sans `pauseId` → 400.
- [ ] Tenter d'envoyer un `pauseId` qui appartient à un autre pointage → 400.

### Critères d'acceptation
- [ ] Migration Doctrine compatible MySQL **ET** PostgreSQL (CLAUDE.md règle 15).
- [ ] Pas de `any` côté front, pas de couleur hardcodée, composant ≤ 150 lignes.
- [ ] `npm run build` + `doctrine:schema:validate` passent.

**Si une case est NON → tu corriges et tu re-vérifies.**

## Livraison
1. Commits atomiques (back, migration, front), convention `feat(validation): ...` / `fix(validation): ...`.
2. Rapport : cases cochées + capture migration générée.
3. Tu push pas. Kévin push.

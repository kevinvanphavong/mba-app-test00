# Validation hebdo — Fixes post-V2 (4 chantiers)

> Corriger 4 défauts remontés en prod par Kévin : bouton "Pointer arrivée" mal cadré, pauses non éditables, heures timeline décalées de −2h, pointages aberrants masqués.

## Contexte
La V2 du panneau détail est en prod (commits ad26f4c → 18f1b1e). 4 retours utilisateur. Cas concret pour le #4 : Mickael sam 30 mai, arrivée pointée 01:45, départ 00:54 → le système affiche 7 min de travail au lieu de bloquer le pointage absurde. Manager risque de valider sans s'en rendre compte.

## Fichiers à lire avant de coder
- `shiftly-app/src/components/validation/ValidationDayRow.tsx` — bouton + pauses non cliquables (#1, #2)
- `shiftly-app/src/components/validation/ValidationCorrectionTimeline.tsx` — fmtBackTime à supprimer (#3)
- `shiftly-app/src/components/validation/ValidationTimePopover.tsx` — étendre pour pauses (#2)
- `shiftly-api/src/Service/ValidationHebdoService.php` — `calculerHeuresNettes` L365, `getCorrectionsFormatees` L789 (#3 + #4)
- `shiftly-app/src/types/validation.ts` — élargir le type `Champ` + ajouter flag `pointageIncoherent`
- `docs/maquettes/pointage-validation-detail-v2.html` — référence visuelle pour le badge alerte

## Décisions actées
1. **Bouton "Pointer arrivée"** — 3 comportements distincts :
   - Aujourd'hui ET `now < heureDebutPlanifiee` → **aucun bouton** (rien à faire, le shift n'a pas commencé)
   - Aujourd'hui ET `now ≥ heureDebutPlanifiee` → bouton `⚠ Pointer arrivée maintenant` qui POST à `now()` (comportement actuel conservé)
   - Jour passé (date < aujourd'hui) → bouton `+ Saisir l'heure d'arrivée` qui **ouvre le TimePicker pré-rempli à `heureDebutPlanifiee`** (le manager saisit la VRAIE heure rétroactive, pas now)
2. **Pauses éditables** — étendre `Champ` à `'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin'`. Chaque pilule pause devient cliquable (onClick → popover) avec 2 sous-cibles : début et fin. Le back gère déjà via `corrigerPointage` L736-737 (passer `pauseId` dans le payload).
3. **Timezone timeline** — bug de sérialisation back. `getCorrectionsFormatees` L798-802 émet `format('Y-m-d H:i:s')` sans offset. Remplacer par `format(\DateTimeInterface::ATOM)` pour `ancienneValeur`, `nouvelleValeur`, `createdAt`. Côté front : supprimer `fmtBackTime` dans `ValidationCorrectionTimeline.tsx` et utiliser directement `formatHeure`.
4. **Pointage incohérent** — nouvelle règle métier dans `calculerHeuresNettes` :
   - Si `heureDepart - heureArrivee < 0` (delta négatif, ex Mickael) → retourner `null` + flag `pointageIncoherent: true` dans le payload jour
   - Si `heureDepart - heureArrivee > 600 min` (>10h, max légal IDCC 1790) → retourner la valeur mais flag `depasseLimiteLegale: true`
   - Côté front : badge rouge `⚠ Pointage incohérent` sur la ligne, `heuresNettes` affichées en `—` avec couleur red, ajout dans `ValidationLegalAlerts`. **La validation employé/semaine est bloquée si ≥1 jour `pointageIncoherent`** (le manager doit corriger avant).

## Tâche

### Front
1. **`ValidationDayRow.tsx`** : étendre `Champ` aux pauses, ajouter `onClick` aux pilules pause (ligne 101-105), passer `pauseId` au popover. Refondre la branche "arrivée vide" en 3 cas selon décision #1 (helper `isToday(jour.date)` + comparaison `now ≥ planifié`).
2. **`ValidationTimePopover.tsx`** : accepter `pauseId?: number` dans les props et le propager au `onApply`. Le `fieldLabel` doit s'adapter (Début pause / Fin pause).
3. **`ValidationCorrectionTimeline.tsx`** : supprimer `fmtBackTime` (L29-35), utiliser `formatHeure` directement sur `ancienneValeur` / `nouvelleValeur` / `createdAt`.
4. **`ValidationDayRow.tsx`** + **CSS** : nouveau variant `incoherent` sur la ligne (fond rouge léger + dot rouge à gauche), badge `⚠ Pointage incohérent` à la place de la durée nette, désactiver le bouton "Valider la semaine" tant qu'au moins un jour est incohérent (passer un flag depuis `ValidationEmployeeDetail`).
5. **`ValidationLegalAlerts.tsx`** : ajouter le type d'alerte "Pointage incohérent" (sévérité haute) pour chaque jour concerné.

### Back
6. **`ValidationHebdoService.php::calculerHeuresNettes` (L365)** :
   - Avant le calcul, comparer `fin->getTimestamp()` et `heureArrivee->getTimestamp()`
   - Si négatif → retourner `null` (modifier la signature : `?int`)
   - Si > 600 min de delta brut (avant soustraction pauses) → calculer normalement mais flagger
7. **Formater les jours (L256-303 etc.)** : ajouter `'pointageIncoherent' => bool`, `'depasseLimiteLegale' => bool` à chaque payload jour.
8. **`getCorrectionsFormatees` L789** : remplacer les 3 `format('Y-m-d H:i:s')` par `format(\DateTimeInterface::ATOM)`.
9. **Endpoint validation employé** (POST /api/pointages/validation/employe/{id}) : refuser (409 Conflict + `hydra:description`) si ≥1 jour `pointageIncoherent` sur la semaine.
10. **`ValidationHebdoService::calculerAlertesLegales`** (chercher la méthode existante) : ajouter une alerte "Pointage incohérent" par jour concerné.

## Ce qu'il ne fait PAS
- Pas de refonte du popover (juste extension props pauseId)
- Pas de modif du calcul des pauses, ni du retard
- Pas d'auto-correction (Mickael devra être corrigé à la main par Kévin via le popover)
- Pas de migration BDD (les flags sont calculés, pas stockés)

## Notes techniques
- **Règle absolue 15** : aucune migration prévue. Si Claude Code en génère une "par sécurité", la rejeter.
- **Multi-tenant** : aucun nouveau Voter nécessaire, les endpoints touchés sont déjà protégés.
- **Helper `isToday`** : `date-fns/isToday` est déjà disponible (vérifier dans `package.json`). Sinon `format(new Date(), 'yyyy-MM-dd') === jour.date`.
- **Test du #3 (timezone)** : on est en heure d'été (CEST = UTC+2), donc le décalage doit disparaître. Si pas concluant en local, vérifier la config Doctrine `date_timezone` dans `config/packages/doctrine.yaml`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api && php bin/console doctrine:schema:validate && php bin/console lint:container
cd shiftly-app && npx tsc --noEmit
# Build après arrêt du dev (feedback_build_dev_conflict)
pkill -f "next dev" && rm -rf shiftly-app/.next && cd shiftly-app && npm run build
```

### Tests fonctionnels (`/pointage/validation`)
- [ ] **#1a** Aujourd'hui, poste 17h, il est 14h → ligne arrivée vide affiche RIEN (ni bouton, ni pilule)
- [ ] **#1b** Aujourd'hui, poste 14h, il est 14h05 → bouton `⚠ Pointer arrivée maintenant`, clic → POST now → arrivée enregistrée
- [ ] **#1c** Jour passé (hier), arrivée vide → bouton `+ Saisir l'heure d'arrivée`, clic → popover ouvre avec valeur initiale = `heureDebutPlanifiee` du poste
- [ ] **#2** Clic sur une pilule de pause `☕ 12:00–12:20` → popover s'ouvre, titre "Début pause", possibilité de choisir Début/Fin (toggle si tu veux ou 2 pilules distinctes), Appliquer → POST `pauseDebut` ou `pauseFin` avec `pauseId`, diff inline sur la pilule
- [ ] **#3** Timeline : heures affichées = heures réelles pointées (plus de −2h). Vérifier sur une correction existante en BDD.
- [ ] **#4a** Créer un pointage avec arrivée 01:45 et départ 00:54 (via fixture ou correction manuelle) → ligne en rouge, badge `⚠ Pointage incohérent`, `heuresNettes` = `—`
- [ ] **#4b** Bouton "Valider la semaine de Lucas" désactivé tant que jour incohérent présent
- [ ] **#4c** Tentative de POST `/api/pointages/validation/employe/{id}` → 409 Conflict avec message clair
- [ ] **#4d** Alerte légale "Pointage incohérent" visible dans le panneau Alertes légales à droite

### Critères d'acceptation
- [ ] Tous les composants modifiés ≤ 150 lignes (règle 3)
- [ ] Aucun `any`, aucune couleur hardcodée
- [ ] Type `Champ` étendu cohérent partout (DayRow, Popover, payload, types/validation.ts)
- [ ] `npm run build` + `tsc --noEmit` + `doctrine:schema:validate` passent
- [ ] Aucune migration générée

### Auto-relecture du diff
`git diff main..HEAD` : régression sur les corrections existantes en BDD (l'ancien format `Y-m-d H:i:s` ne traîne nulle part) ? Le bouton de validation hebdo (`Tout valider`) gère-t-il aussi le blocage par incohérence ? Le `pauseId` propagé sans casser les corrections d'arrivée/départ ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par chantier : `fix(validation): scope arrival button by date+time`, `feat(validation): editable break times`, `fix(validation): emit ATOM datetimes for corrections`, `feat(validation): block incoherent timepunches with red badge`, etc.
2. Si tu touches `ValidationLegalAlerts` ou la logique de validation : un commit séparé `feat(validation): incoherent-timepunch alert blocks weekly validation`
3. Rapport final : cases d'auto-vérif cochées + capture du cas Mickael avant/après
4. Mise à jour `ARCHITECTURE.md` si tu introduis de nouveaux flags dans le payload jour
5. **Tu push pas. Kévin push.**

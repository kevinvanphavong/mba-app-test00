# Planning — multi-shifts par jour + absences dupliquées + bloc heures inline

> Permettre plusieurs assignations zone par staff/jour (y compris coupures), copier les absences au « Dupliquer semaine », fiabiliser templates+absences, et passer le bloc heures sous le nom du staff.

## Contexte
Aujourd'hui un staff ne peut avoir qu'un shift par jour : l'UI cache le `+` dès qu'un shift existe, et la contrainte BDD `uniq_poste (service_id, zone_id, user_id)` interdit la même zone 2× le même jour (cas réel : coupure 11h-14h / 18h-23h). `duplicateWeek()` copie les Postes mais pas les Absences. En prod, les templates n'appliquent pas les absences alors que le code le fait en local. Le bloc heures (contrat/planifié + barre) est à droite du nom et masqué en mobile.

## Fichiers à lire avant de coder
- `shiftly-app/src/components/planning/PlanningRow.tsx` — DayCell + bloc heures (L148-168)
- `shiftly-app/src/components/planning/ShiftModal.tsx` — création/édition shift
- `shiftly-app/src/hooks/usePlanning.ts` — mutations postes/duplicate
- `shiftly-api/src/Entity/Poste.php` — contrainte `uniq_poste` (L27)
- `shiftly-api/src/Controller/CreatePosteController.php` — catch UniqueConstraintViolation (L108)
- `shiftly-api/src/Service/PlanningService.php` — `duplicateWeek()` (L406), calculs heures/alertes
- `shiftly-api/src/Controller/PlanningTemplateController.php` — capture/apply absences

## Décisions actées (ne pas remettre en cause)
| Décision | Choix |
|---|---|
| Même zone 2× le même jour | Autorisé (coupure) → on retire la contrainte `uniq_poste` |
| Garde-fou remplaçant | Validation métier anti-chevauchement horaire (même user + même service) → 409 |
| Bloc heures | Sous le nom, en ligne (heures + barre côte à côte), **visible en mobile** |
| Dupliquer semaine + absences | Copie en mode APPEND non destructif (même logique que l'apply template) |

## Tâche

### A — Multi-shifts par jour (coupures incluses)
1. `Poste.php` : supprime l'attribut `#[ORM\UniqueConstraint(name: 'uniq_poste', …)]`. Génère la migration (DROP INDEX) — **règle 15 du CLAUDE.md** : compatible MySQL ET PostgreSQL, testée sur les deux.
2. `CreatePosteController.php` : remplace le catch `UniqueConstraintViolationException` par une validation explicite avant persist : pour le même user + même service, les créneaux `[heureDebut, heureFin]` ne doivent pas se chevaucher (gère les shifts de nuit qui passent minuit comme `calculateShiftDuration`). Chevauchement → 409 avec message clair. Applique la même validation au PATCH d'un poste existant (state processor ou listener de validation, pas dans un controller métier).
3. `PlanningRow.tsx` (DayCell) : quand des shifts existent déjà, affiche un petit `+` discret sous les blocs (visible au hover, comme l'existant) pour ajouter un 2e shift le même jour. Cellule avec absence : comportement inchangé.
4. Vérifie que `PlanningService` (totalHeures, alertes légales MAX_JOURNALIER/REPOS_QUOTIDIEN/PAUSE_6H) agrège correctement plusieurs shifts d'un même jour — corrige si un calcul suppose 1 shift/jour. Idem export PDF.

### B — Dupliquer semaine : copier les absences
5. `PlanningService::duplicateWeek()` : après la copie des postes, copie les Absences de la semaine source (même décalage de jours), en sautant les jours où le user a déjà une absence sur la cible. Retourne les compteurs si la signature le permet déjà côté front.

### C — Templates + absences en prod (diagnostic)
6. Vérifie que la migration créant `planning_template_absence` existe dans `shiftly-api/migrations/` et qu'elle est postérieure ou non au dernier déploiement visible. Vérifie le flux complet create → apply en local (fixture : semaine avec 1 absence → créer template → appliquer sur semaine vierge → l'absence doit apparaître).
7. Dans `TemplatesModal.tsx`, affiche le compteur d'absences du template (`absenceCount` déjà renvoyé par l'API) à côté du compteur de shifts — rend visible un vieux template créé avant la feature (0 absence).
8. Livre à Kévin la commande à exécuter sur Railway pour vérifier l'état des migrations prod (`doctrine:migrations:status`) + la liste des migrations potentiellement manquantes.

### D — Bloc heures inline sous le nom
9. `PlanningRow.tsx` : déplace le bloc heures (L158-167) sous le nom du staff : une ligne `12h / 35h` + barre de progression à la suite, dans la colonne sticky. Retire `hidden tablet:flex` → visible en mobile (colonne 140px : adapte tailles de police/barre). `typeContrat` peut passer en tooltip ou rester si la place le permet.
10. `PlanningRow.tsx` fait déjà 190 lignes : extrais la colonne employé dans `components/planning/StaffRowHeader.tsx` (règle 3 : max 150 lignes/fichier).

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
- [ ] Créer 2 shifts même user/même jour sur 2 zones différentes → OK
- [ ] Créer 2 shifts même user/même jour/même zone sans chevauchement (11-14 + 18-23) → OK
- [ ] Créer 2 shifts qui se chevauchent (11-14 + 13-17) → 409 + toast clair
- [ ] totalHeures du staff = somme des 2 shifts ; alertes légales cohérentes (MAX_JOURNALIER déclenche si > 10h cumulées)
- [ ] Dupliquer une semaine avec 1 CP + 1 REPOS → absences présentes sur la cible
- [ ] Créer template depuis semaine avec absence → appliquer → absence présente ; modale affiche « X shifts · Y absences »
- [ ] Bloc heures visible sous le nom en mobile (DevTools 375px) et tablet/desktop

### Critères d'acceptation
- [ ] Migration DROP INDEX rejouée sur MySQL ET PostgreSQL sans erreur (règle 15)
- [ ] Validation chevauchement côté back (pas seulement front)
- [ ] `StaffRowHeader.tsx` ≤ 150 lignes, `PlanningRow.tsx` ≤ 150 lignes
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] `npm run build` + `doctrine:schema:validate` passent

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile : régression silencieuse (drag & drop d'un shift vers un jour qui en a déjà un ?), scope creep, portabilité MySQL/PostgreSQL OK ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques par bloc (A/B/C/D), messages `type(scope): summary`
2. Rapport de vérification (cases cochées + preuves : sorties de commandes, captures)
3. Note de risque : la migration DROP INDEX doit passer en prod Railway **avant** le déploiement front
4. Tu push pas. Kévin push.

# QA pré-push — Module HACCP MVP

> Joue les 5 vérifications skippées par la livraison HACCP MVP (commits `95f52c3..50c6da9`) et reporte. Aucune modification de code attendue, sauf si une vérif révèle un bug — alors corrige + commit.

## Contexte
Le module HACCP a été livré (11 commits + 1 commit docs sur `main`, non pushé). 5 auto-vérifs critiques n'ont pas été lancées par la session précédente : build front, multi-tenant, E2E modal, seuils runtime, sync idempotent. À valider avant que Kévin push.

## Fichiers à lire avant de coder
- `shiftly-api/migrations/Version20260602120000.php` — pour comprendre les 3 tables créées
- `shiftly-api/src/EventListener/HaccpProofConformityChecker.php` — calcul `est_conforme`
- `shiftly-api/src/Service/Haccp/HaccpMissionGenerator.php` — logique sync idempotente
- `shiftly-api/src/EventListener/CentreHaccpSeedListener.php` — flush imbriqué à confirmer en runtime
- `shiftly-app/src/components/haccp/HaccpCheckModal.tsx` — entry point modal côté front

## Notes techniques
- Symfony local sur `http://localhost:8000`, Next sur `http://localhost:3000`.
- Mdp fixtures uniforme : `shiftly2026`.
- 2 managers fixtures de centres distincts pour le test multi-tenant : `fabrice@speedpark-bourges.fr` (centre Speedpark Bourges) et `olivier@bk-orleans-paris.fr` (centre Burger King Orléans).
- Si la BDD locale n'a pas la migration HACCP : `php bin/console doctrine:migrations:migrate -n`.
- Restart Next si build ou hot-reload bizarre : `pkill -f "next dev" ; rm -rf .next ; npm run dev` (mémoire `next_dev_restart_after_bulk_changes`).

## Tâche
1. **Build front** : `cd shiftly-app && npm run build` — doit passer sans erreur TS strict ni warning ESLint critique.
2. **Test multi-tenant en curl** :
   - Login `fabrice@speedpark-bourges.fr` → récupère `$JWT_A`
   - Login `olivier@bk-orleans-paris.fr` → récupère `$JWT_B`
   - `curl /api/haccp_equipements` avec `$JWT_A` puis `$JWT_B` → vérifie 0 fuite cross-tenant sur les 3 ressources (`haccp_equipements`, `mission_haccp_specs`, `completion_haccp_proofs`)
   - Si fuite → corrige le Voter défaillant, ajoute test, commit `fix(haccp): voter cross-tenant leak on <ressource>`
3. **Test seuil runtime** (vérif `HaccpProofConformityChecker`) :
   - Crée en BDD un équipement Frigo `seuil_max=4`, lié à une mission HACCP TEMPERATURE
   - POST `/api/completions` avec `haccpProof.valeur_numerique=9.5` (mission + poste fixtures existants)
   - Vérifie en BDD : `est_conforme = 0` (false) sur la proof créée
   - Refais avec `valeur_numerique=3.2` → `est_conforme = 1` (true)
4. **Test sync idempotent** :
   - `php bin/console doctrine:query:sql "SELECT COUNT(*) FROM mission_haccp_spec WHERE equipement_id IS NOT NULL AND archivee=0"` → note `$N`
   - Appelle `HaccpMissionGenerator::synchronizeForCentre(<centre Speedpark>)` 3 fois (script CLI, controller, ou Symfony shell)
   - Re-query : `$N` ne doit pas avoir bougé
   - Désactive un équipement → re-query : `$N -= 2`. Réactive → `$N += 2`. Pas plus.
5. **Test E2E modal** : ouvre `/service` connecté en employé du centre Speedpark, coche une mission HACCP T° auto-seedée, vérifie que le label modal contient le nom de l'équipement + `début de service` / `fin de service`, saisis une valeur conforme, valide, vérifie qu'une `Completion` + une `CompletionHaccpProof` sont créées en BDD avec `est_conforme=1`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Avant tout
```bash
cd shiftly-api && php bin/console doctrine:schema:validate
php bin/console lint:container
```

### Pour chaque test ci-dessus
- [ ] Test 1 (build front) — sortie `npm run build` collée dans le rapport
- [ ] Test 2 (multi-tenant) — payloads JSON tronqués (5 premiers items) en preuve, par centre
- [ ] Test 3 (seuil runtime) — valeur `est_conforme` lue en BDD, par les 2 cas (9.5 puis 3.2)
- [ ] Test 4 (sync idempotent) — count avant/après chaque appel
- [ ] Test 5 (E2E modal) — capture du payload `POST /api/completions` envoyé + ligne BDD insérée

### Critères d'acceptation
- [ ] Les 5 tests passent sans modification de code
- [ ] OU bug trouvé → corrigé en commit atomique + test rejoué OK
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (notamment règle 14 multi-tenant)

### Auto-relecture
Si tu as dû corriger un Voter ou le checker → `git diff` en hostile, vérifie portabilité MySQL/PostgreSQL, et que tu n'as pas régressé un autre Voter HACCP par effet de bord.

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Rapport de QA (les 5 sections, preuves brutes incluses).
2. Liste des éventuels commits correctifs (zéro si tout passe — ce serait l'idéal).
3. Recommandation explicite : **GO push** ou **NO-GO push** avec raison.
4. Tu push pas. Kévin push.

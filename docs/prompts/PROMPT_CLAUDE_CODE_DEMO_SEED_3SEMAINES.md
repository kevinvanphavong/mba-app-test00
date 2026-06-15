# Demo seed rejouable : données de démo + plannings/services sur 3 semaines glissantes

> Une commande unique, rejouable en terminal (y compris prod), qui (re)charge le jeu de
> données de démo affiché en local — avec services et plannings couvrant **semaine
> dernière + courante + prochaine**, toujours recalculés à la date d'exécution.

## Contexte
Le besoin de Kévin : pouvoir « rafraîchir » les données de démo avant une présentation,
en relançant une commande, pour que les écrans Planning/Service montrent toujours du passé,
du présent et du futur. Les fixtures Alice actuelles (`fixtures/*.yaml`) **sont déjà** la
source des données vues en local et utilisent déjà des dates relatives
(`<(new \DateTimeImmutable('today'))>`, `'monday this week'`). Il manque : (a) une couverture
**3 semaines pleines** pour services + plannings, (b) une **commande sûre** pour rejouer ça
en prod sans tout casser.

## Décisions actées (ne pas rouvrir)
- Source de vérité de la démo = les `fixtures/*.yaml` existantes (pas de dump inverse de la
  BDD locale). Si Kévin a modifié des données via l'UI en local et veut les garder, c'est
  hors scope — à signaler, pas à deviner.
- Dates **ancrées sur le lundi de la semaine** via expressions Alice relatives, jamais en dur.
- 3 semaines = `lundi S-1` → `dimanche S+1`, pour **chaque centre** de démo.
- **Pointages générés sur les jours PASSÉS uniquement** (toute la semaine S-1 + les jours déjà
  écoulés de S), pour rendre la page **Validation hebdo** utilisable en démo sur tous les centres.
  Aucun pointage sur les jours futurs (personne n'a encore badgé).
- La commande **purge puis recharge** (load Alice). Donc : garde-fou prod obligatoire.

## Fichiers à lire avant de coder
- `fixtures/speedpark.yaml` (~l.228 Service, ~l.274 Poste, ~l.407 PlanningWeek) — le pattern de dates relatives à généraliser
- `config/packages/hautelook_alice.yaml` — `fixtures_path` + la note « prod-démo re-semée via LOAD_FIXTURES »
- `src/Command/SeedDemoPointagesCommand.php` — **la logique de génération de pointages réalistes (arrivées/départs/pauses, mode showcase) déjà écrite, à généraliser** : aujourd'hui 1 centre + 1 semaine, dev-only
- `src/Entity/Service.php` (`date`, `heureDebut`, `statut`) · `src/Entity/PlanningWeek.php` (`weekStart`) · `src/Entity/Poste.php` (`heureDebut`)
- `src/Entity/{Pointage,PointagePause,ValidationHebdo}.php` — modèle du pointage et de la validation hebdo
- `CLAUDE.md` — règles 13/15 (migrations/SQL portable, docs slim)

## Tâche
1. **Étendre services + plannings à 3 semaines** dans chaque fixture de centre qui en a
   déjà : pour chaque jour ouvré de `S-1`, `S`, `S+1`, générer le `Service` (avec `statut`
   cohérent : passé = `TERMINE`, jour même/futur = `PLANIFIE`) + ses `Poste`/assignations,
   et la `PlanningWeek` correspondante (`weekStart` = lundi de chaque semaine). Utiliser des
   ancres relatives type `<(new \DateTimeImmutable('monday this week'))>` ± `7 days`/`N days`.
   Garder les horaires alignés sur `openingHours` du centre. Respecter la contrainte
   `uniq_poste` (pas de doublon user/zone/heure sur un même service).
2. **Factoriser** si le volume YAML explose : si répéter 21 jours × N centres devient
   ingérable, extraire la génération des services/plannings dans une étape dédiée
   (helper Alice `<(...)>` paramétré, ou une passe du command) — mais ça reste **reproductible
   et déterministe**, pas de faker aléatoire sur les dates.
3. **Pointages réalistes sur les jours passés** : généraliser la logique de
   `SeedDemoPointagesCommand` (aujourd'hui 1 centre + 1 semaine, dev-only) pour couvrir
   **tous les centres de démo** et **tous les jours passés** de la fenêtre (S-1 complète +
   jours écoulés de S). Pour chaque `Poste` d'un service passé : générer `Pointage`
   (+ `PointagePause`) cohérents — arrivée ≈ heure de début avec légère variance (retards/avances
   réalistes), pause(s), départ ≈ heure de fin, quelques heures sup occasionnelles. Garder le
   mode `--showcase` (cas multi-pauses / double assignation). **Jamais** de pointage sur un jour
   futur. Réutiliser le code existant plutôt que de le réécrire.
4. **Commande `app:demo:seed`** (sur le modèle de `SeedDemoPointagesCommand`) qui orchestre tout :
   - recharge le jeu Alice de démo (équivalent `hautelook:fixtures:load --purge-with-truncate`)
     PUIS génère les pointages des jours passés (étape 3) ;
   - **garde-fou prod** : si `APP_ENV=prod`, exiger `--force` + une confirmation interactive
     explicite (« cela EFFACE et recharge la base — confirmer ? ») ; refuser sinon ;
   - message final : centres / services / plannings / **pointages** semés + plage de dates couverte ;
   - aucune SQL spécifique à un moteur (doit marcher MySQL **et** Postgres — la prod n'est pas
     encore basculée Postgres).
5. **Doc** : 4-6 lignes dans le README (ou `docs/`) — quand et comment lancer la commande
   avant une présentation, et l'avertissement « efface les données existantes ».

## Ce qu'il ne fait PAS (anti-scope)
- Pas de dump BDD→fixtures (reverse). Pas de nouvelle entité.
- Ne touche pas aux données de référence (staff, missions, zones, tutoriels, HACCP) au-delà de
  ce que les fixtures contiennent déjà — seuls **services, plannings et pointages** sont
  étendus/générés sur la fenêtre 3 semaines.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php php bin/console app:demo:seed            # dev : doit semer sans --force
docker compose exec php php bin/console doctrine:schema:validate
docker compose exec php vendor/bin/phpunit && vendor/bin/phpstan analyse
```

### Tests fonctionnels
- [ ] Après `app:demo:seed`, la page **Planning** affiche des créneaux sur S-1, S et S+1 (naviguer ‹ ›)
- [ ] La page **Services** liste des services passés (TERMINE) ET futurs (PLANIFIE)
- [ ] La page **Validation hebdo** est exploitable sur **plusieurs centres** : semaine S-1 remplie
  de pointages cohérents (arrivées/départs/pauses, écarts réalistes), prête à valider
- [ ] **Aucun pointage sur un jour futur** (jours de S+1 et jours à venir de S vides)
- [ ] Relancer la commande une 2ᵉ fois → même résultat, aucune erreur (idempotent via purge)
- [ ] Changer la date système (ou tester un autre jour) → les 3 semaines + pointages suivent toujours « aujourd'hui »
- [ ] `APP_ENV=prod` sans `--force` → la commande refuse ; avec `--force` → confirmation demandée
- [ ] Aucune violation `uniq_poste` au chargement ; `schema:validate` OK
- [ ] `git diff main..HEAD` relu en hostile (portabilité MySQL/Postgres, pas de date en dur)

## Livraison
1. Commits atomiques (`feat(fixtures): services/plannings sur 3 semaines glissantes`, `feat(command): app:demo:seed + garde-fou prod`, `docs: …`)
2. Rapport : centres/services/plannings semés + plage de dates + note si volume factorisé
3. Note de risque : la commande EFFACE la base — rappeler le garde-fou prod
4. Tu push pas. Kévin push.

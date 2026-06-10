# Palier 0 — Infra Docker Postgres + CI (transposition du palier 1 v2)

> Donner à la V1 une infra reproductible : Postgres en Docker, CI verte, analyse
> statique avec baseline — en réutilisant les assets déjà écrits dans `v2/`.

## Contexte
La refonte v2 est gelée (voir `PLAN_DURCISSEMENT_V1.md`, qui fait foi sur le layout :
**on code désormais directement dans `shiftly-api/` et `shiftly-app/`** — la règle
"code neuf dans v2/" de `CLAUDE.md` est suspendue). Données prod = fixtures →
la migration MySQL→PostgreSQL se fait maintenant, tant qu'elle est gratuite.

## Décisions actées (ne pas rouvrir)
- PostgreSQL 16 partout (local Docker = CI). MySQL abandonné.
- **Squash** : les 37 migrations existantes sont supprimées, remplacées par 1 migration
  initiale générée sur Postgres.
- PHPStan avec **baseline** : on fige le legacy (17 600 LOC), on interdit le nouveau.
- Les jobs CI `v2/*` sont **remplacés** par les jobs V1 (v2 gelée).

## Fichiers à lire avant de coder
- `PLAN_DURCISSEMENT_V1.md` — palier 0, le cahier des charges
- `v2/docker-compose.yml` + `v2/shiftly-api/Dockerfile` — à transposer
- `v2/Makefile` — cibles à adapter
- `.github/workflows/ci.yml` — chemins `v2/*` à remplacer
- `shiftly-api/config/packages/doctrine.yaml` + `shiftly-api/.env` — DATABASE_URL, driver
- `v2/shiftly-app/` (configs vitest/eslint) — setup de test front à copier

## Tâche
1. `docker-compose.yml` **racine** : services `db` (postgres:16-alpine + healthcheck),
   `mailpit`, `php` (build `./shiftly-api`, Dockerfile repris de v2).
2. `shiftly-api/.env` + `.env.example` : `DATABASE_URL` Postgres (`db:5432` conteneur,
   `localhost:5432` host). Aucun secret committé.
3. Squash migrations : supprimer `shiftly-api/migrations/*`, `doctrine:migrations:diff`
   sur Postgres vierge → 1 migration initiale. Corriger tout SQL spécifique MySQL
   rencontré (fonctions, types, DQL).
4. Recharger les fixtures Alice (`hautelook:fixtures:load`) et corriger ce qui casse.
5. PHPStan + PHP-CS-Fixer dans `shiftly-api` (configs reprises de v2) + `phpstan-baseline.neon`.
6. Setup Vitest + Testing Library dans `shiftly-app` (repris de v2) + 1 test smoke.
7. `.github/workflows/ci.yml` : jobs backend (composer, phpstan, cs-fixer dry-run,
   rejeu migration Postgres service, phpunit) et frontend (lint, tsc, vitest, build)
   pointant `shiftly-api/` et `shiftly-app/`.
8. `Makefile` racine : `up`, `down`, `logs`, `test`, `fixtures`.
9. Mettre à jour `CLAUDE.md` (règle 15) : layout (v2 gelée, code actif = racine),
   BDD Postgres, pointer `PLAN_DURCISSEMENT_V1.md`.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
make up                          # db healthy + mailpit + php
docker compose exec php php bin/console doctrine:migrations:migrate -n
docker compose exec php php bin/console hautelook:fixtures:load -n
docker compose exec php php bin/console doctrine:schema:validate
cd shiftly-api && vendor/bin/phpstan analyse && vendor/bin/php-cs-fixer fix --dry-run && vendor/bin/phpunit
cd shiftly-app && npm run lint && npm run test && npm run build
```

- [ ] `make up` → Postgres healthy, migration initiale + fixtures passent
- [ ] `doctrine:schema:validate` OK (mapping = BDD)
- [ ] Les 3 tests PHPUnit existants passent toujours
- [ ] PHPStan vert (baseline committée), CS-Fixer vert
- [ ] Front : lint + vitest (smoke) + build verts
- [ ] App fonctionnelle en local contre Postgres : login + dashboard + service du jour OK
- [ ] Aucun secret committé ; `git diff` relu en hostile (SQL MySQL résiduel ?)

## Livraison
1. Commits atomiques (`chore(infra): …`, `chore(db): squash migrations postgres`, …)
2. Rapport : cases cochées + sortie des commandes clés
3. Note de risque : lister tout SQL adapté MySQL→Postgres (à retester manuellement)
4. Tu push pas. Kévin push.

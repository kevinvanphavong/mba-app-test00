# Aligner la BDD de dev sur la prod (MySQL 8.0)

> Faire passer le dev local de SQLite à MySQL 8.0 pour que les migrations Doctrine générées soient compatibles prod.

## Contexte

La prod Railway tourne sur **MySQL 8.0** (cf. `Dockerfile` : `pdo_mysql`). En local, `shiftly-api/.env.local` pointe sur **SQLite** → `doctrine:migrations:diff` génère du SQL SQLite (recréation de table via `__temp__`) qui casse au push (incident Railway 2026-04-25). 11 des 32 migrations existantes contiennent déjà ce SQL non portable.

Un script `setup-mysql-local.sh` a déjà été écrit à la racine : utilise-le comme référence, mais exécute et adapte les étapes toi-même — tu as le terminal, tu peux diagnostiquer.

## Fichiers à lire avant de coder

- `setup-mysql-local.sh` — script de référence (racine du repo)
- `docs/MIGRATIONS_WORKFLOW.md` — le pourquoi + le workflow cible
- `shiftly-api/Dockerfile` — preuve que la prod = MySQL 8.0
- `shiftly-api/.env` et `shiftly-api/.env.local` — config BDD actuelle
- `dev-start.sh` — script de lancement (déjà adapté MySQL)

## Tâche

1. Si `.git/index.lock` existe à la racine, supprime-le (lock résiduel qui bloque les commits).
2. Installe MySQL 8.0 via Homebrew si absent (`brew install mysql@8.0`), démarre le service (`brew services start mysql@8.0`). `mysql@8.0` est keg-only → ajoute son `bin` au PATH.
3. Détermine l'accès root : teste `mysql -u root -e "SELECT 1"`. Si « Access denied », une install précédente a un mot de passe — demande-le à Kévin, ou réinitialise-le à vide via `mysqld_safe --skip-grant-tables` + `ALTER USER 'root'@'localhost' IDENTIFIED BY ''`.
4. Crée la base : `CREATE DATABASE IF NOT EXISTS shiftly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`.
5. Bascule la ligne `DATABASE_URL` de `shiftly-api/.env.local` sur `mysql://root:<pw>@127.0.0.1:3306/shiftly?serverVersion=8.0&charset=utf8mb4`. Réécris **uniquement cette ligne** (préserve les secrets Sentry/R2), fais une sauvegarde `.bak`.
6. Construis le schéma **depuis les entités**, sans rejouer les 32 migrations : `doctrine:schema:create`. Puis marque toutes les migrations comme appliquées (`doctrine:migrations:sync-metadata-storage` + `doctrine:migrations:version --add --all`).
7. Charge les fixtures : `php bin/console hautelook:fixtures:load --no-interaction`.

## Notes techniques

- **Ne PAS** lancer `doctrine:migrations:migrate` depuis zéro : les 11 migrations SQLite-style risquent de casser sur MySQL. `schema:create` depuis les entités donne le même schéma que la prod resync.
- `.env.local` est gitignoré : tu peux l'éditer librement, jamais le commiter (règle 9 du `CLAUDE.md`).
- Mot de passe root dans l'URL : URL-encode-le s'il contient des caractères spéciaux (`@`, `:`, `/`).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après mise en place
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
```

### Tests fonctionnels
- [ ] `mysql -u root [-p] -e "SHOW TABLES FROM shiftly"` retourne les ~13 tables
- [ ] `doctrine:schema:validate` répond « schema is in sync » (mapping + database)
- [ ] L'API démarre (`symfony server:start`) et `/api` répond sans erreur BDD
- [ ] Login OK sur `localhost:3000` avec `kevin@bowlingcentral.fr` / `shiftly2026`

### Critères d'acceptation
- [ ] `shiftly-api/.env.local` : `DATABASE_URL` en `mysql://`, une sauvegarde `.bak` existe
- [ ] Secrets Sentry et R2 toujours présents dans `.env.local`
- [ ] Aucune migration rejouée depuis zéro (schéma construit via `schema:create`)
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte

### Auto-relecture du diff
`git diff` : seuls les fichiers attendus sont touchés (pas de `.env.local` stagé, pas de fichier prod modifié).

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques (`chore(dev): ...`) — `setup-mysql-local.sh`, `dev-start.sh`, `docs/MIGRATIONS_WORKFLOW.md`, ce prompt s'ils ne sont pas déjà commités.
2. Rapport : sortie de `doctrine:schema:validate` + liste des tables créées.
3. Note si le mot de passe root a dû être réinitialisé (Kévin doit le savoir).
4. Tu push pas. Kévin push.

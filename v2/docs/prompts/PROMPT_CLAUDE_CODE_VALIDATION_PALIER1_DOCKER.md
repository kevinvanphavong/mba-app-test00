# Durcir le service `php` + valider le palier 1 end-to-end (Docker)

> Rendre l'infra Docker réellement exécutable (Dockerfile PHP avec `pdo_pgsql`) puis
> **prouver** le palier 1 : `make up` → Postgres healthy → migrations rejouées sur la
> vraie BDD. Objectif : valider sans dépendre du PHP local de Kévin.

## Contexte
Le palier 1 est committé mais jamais exécuté (Docker pas lancé, CI pas déclenchée).
Le service `php` du compose est une image `php:8.4-fpm` **nue** : ni `pdo_pgsql`, ni
Composer → impossible de lancer les migrations dans le conteneur. On corrige ça (vrai
Dockerfile) et on valide la chaîne complète. La migration d'amorçage fait juste
`CREATE EXTENSION IF NOT EXISTS pgcrypto`.

## Fichiers à lire avant de coder
- `v2/docker-compose.yml` — service `php` à remplacer par un build.
- `v2/shiftly-api/.env` — `DATABASE_URL` (Postgres `db:5432` côté conteneur).
- `v2/shiftly-api/config/packages/doctrine.yaml` — driver Postgres.
- `v2/shiftly-api/migrations/Version20260609000000.php` — la migration à rejouer.
- `CLAUDE.md` — règles 12 (secrets) et 13 (migrations Postgres).

## Précondition — Docker disponible
1. `docker info` : si OK, continuer. Sinon tenter `brew install --cask docker` puis
   `open -a Docker`, attendre que le daemon réponde (`docker info` en boucle, timeout raisonnable).
2. Si Docker exige une action GUI (acceptation licence / droits admin) que tu ne peux
   pas faire en CLI → **t'arrêter et le signaler clairement à Kévin** (c'est la seule
   action manuelle de sa part), puis reprendre une fois Docker prêt.

## Tâche
1. Créer `v2/shiftly-api/Dockerfile` basé sur `php:8.4-fpm` :
   - paquets système : `libpq-dev libicu-dev git unzip zip`
   - extensions : `docker-php-ext-install pdo pdo_pgsql intl opcache`
   - Composer : copier depuis l'image `composer:2` (`COPY --from=composer:2 /usr/bin/composer /usr/bin/composer`)
   - `WORKDIR /var/www/api`
2. Dans `v2/docker-compose.yml`, remplacer le service `php` `image:` par un `build:`
   pointant sur `./shiftly-api` (garder le volume, le `working_dir`, le `depends_on`
   `db: healthy` et la `DATABASE_URL` côté conteneur). Ajouter de quoi garder le
   conteneur vivant pour `exec` (fpm tourne déjà — OK).
3. Lancer et valider la chaîne (voir Auto-vérification). Si `vendor/` monté depuis
   l'hôte pose souci, `composer install` dans le conteneur.
4. Ne **rien** committer qui contienne un secret (`.env.dev` est gitignored — ne pas le réintroduire).

## Ce qu'il ne fait PAS (anti-scope)
- Aucune entité métier, aucune route, aucun code applicatif (c'est le palier 2).
- Pas de modif du front.
- Pas de nouvelle migration (on rejoue l'existante).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Commandes
```bash
cd v2
docker compose up -d --build
docker compose ps                 # db (healthy) + mailpit + php up
docker compose exec -T php composer install --no-interaction
docker compose exec -T php php bin/console doctrine:migrations:migrate -n
docker compose exec -T php php bin/console doctrine:migrations:status
# Contrôle direct en base : l'extension existe
docker compose exec -T db psql -U shiftly -d shiftly -c "\dx pgcrypto"
```

### Tests fonctionnels
- [ ] `docker compose ps` : `db` **(healthy)**, `mailpit` et `php` **up**.
- [ ] `doctrine:migrations:migrate` s'exécute **sans erreur** sur Postgres.
- [ ] `doctrine:migrations:status` montre la migration `Version20260609000000` **exécutée**.
- [ ] `\dx pgcrypto` confirme l'extension présente.
- [ ] Mailpit accessible sur http://localhost:8025.

### Critères d'acceptation
- [ ] `pdo_pgsql` + `intl` présents dans le conteneur (`docker compose exec -T php php -m | grep -E "pdo_pgsql|intl"`).
- [ ] Aucun secret committé (`.env.dev` reste gitignored — règle 12).
- [ ] Aucune migration générée hors Postgres (règle 13).
- [ ] Aucun code applicatif ajouté (anti-scope).

### Auto-relecture du diff
`git diff` relu en hostile : le Dockerfile est-il reproductible from scratch ? un
secret a-t-il fui ? le compose démarre-t-il bien depuis un `docker compose down -v` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques (ex : `chore(infra): Dockerfile php (pdo_pgsql, intl, composer)`,
   `chore(infra): service php en build dans compose`).
2. **Rapport** : sortie de `docker compose ps`, du `migrations:status` et du `\dx pgcrypto`
   (preuves réelles, pas « ça devrait marcher »). Préciser si une action GUI Docker a été nécessaire.
3. Tu push pas. Kévin push.

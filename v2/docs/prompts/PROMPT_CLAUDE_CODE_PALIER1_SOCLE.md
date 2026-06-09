# Palier 1 — Socle infra + CI (groupé : infra + back + front)

> Poser dans `v2/` l'environnement de dev reproductible, les deux scaffolds
> (Symfony + Next) qui bootent, et une CI **verte** qui rejoue les migrations sur
> une vraie Postgres. Aucun code métier : juste la fondation testable.

## Contexte
`v2/` est vide (juste un README). C'est le palier 1 du BRIEF : la fondation sur
laquelle s'appuieront l'auth multi-tenant (palier 2) puis les modules. Le lever de
la v2, c'est la CI qui teste avant push — donc elle existe dès maintenant, verte à
vide. Décision actée : **Postgres partout** (local = CI = prod), tuant la divergence
de moteurs de la v1.

## Fichiers à lire avant de coder
- `CLAUDE.md` — règles absolues, stack, sécurité/secrets (règles 2, 5, 12, 13, 14).
- `BRIEF_PROJET_SHIFTLY_V2.md` §4 (décisions 1-13) et §6 (ordre des paliers).
- `v2/README.md` — layout cible `v2/shiftly-api` + `v2/shiftly-app`.
- `shiftly-app/` (v1) — récupérer **uniquement** les design tokens (CSS vars / config Tailwind), pas l'archi.
- `.gitignore` (racine) — à étendre, pas réécrire.

## Décisions actées (ne pas rouvrir)
- **PostgreSQL 16** en Docker + CI. Pas de MySQL, pas de SQLite (même en test).
- Stack : **Symfony 8 + API Platform 4 + PHP 8.4** / **Next 15 + React 19 + Tailwind 4 + TS strict**.
- **Aucun code métier** ce palier : pas d'entité fonctionnelle, pas d'auth, pas d'écran. Juste le squelette qui boote.

## Tâche

### A. Infra (`v2/`)
1. `v2/docker-compose.yml` : `db` (postgres:16, volume nommé, healthcheck `pg_isready`),
   `mailpit` (ports 1025/8025), `php` (php:8.4-fpm, dépend de `db` healthy).
2. `v2/.env.example` (DATABASE_URL Postgres + MAILER_DSN Mailpit). **Jamais** de `.env`
   réel committé. Étendre `.gitignore` racine : `v2/**/.env*` sauf `.env.example`.
3. `v2/Makefile` : cibles `up`, `down`, `logs`, `ps`, `test`.

### B. Backend (`v2/shiftly-api`)
4. Scaffold Symfony 8 + API Platform 4 + Doctrine, connecté à la Postgres du compose.
5. PHPStan (niveau max raisonnable) + ECS/PHP-CS-Fixer configurés.
6. Une **migration d'amorçage** (extension `pgcrypto` ou table technique minimale)
   générée et rejouable sur Postgres (CLAUDE.md règle 13 : jamais de migration SQLite).
7. PHPUnit installé + 1 test smoke (le kernel boote).

### C. Frontend (`v2/shiftly-app`)
8. Scaffold Next 15 (App Router) + React 19 + Tailwind 4 + TypeScript **strict**.
9. Providers **React Query v5** + **Zustand** branchés (CLAUDE.md règles 5, 7).
10. Design tokens repris de la v1 (CSS vars + Tailwind), **zéro couleur hardcodée**.
11. ESLint strict + 1 test Vitest/Testing-Library smoke (la page racine rend).

### D. CI (`.github/workflows/ci.yml`)
12. Job `backend` : service Postgres → `composer install` → PHPStan → ECS →
    **rejeu des migrations sur Postgres** → PHPUnit.
13. Job `frontend` : `npm ci` → ESLint → `tsc --noEmit` → `npm run build` → Vitest.
14. Workflow **vert** sur une PR de test, structuré (jobs séparés, cache deps).

## Ce qu'il ne fait PAS (anti-scope)
- Pas d'auth / JWT / cookie (palier 2).
- Pas d'entité métier ni de seed de profil secteur (paliers 2-3).
- Pas d'écran applicatif (juste la page Next par défaut nettoyée).
- Pas de génération de types OpenAPI (rien à générer tant qu'il n'y a pas d'API).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Commandes
```bash
cd v2 && docker compose up -d && docker compose ps   # db + mailpit + php healthy
# Backend
cd v2/shiftly-api
composer install
php bin/console doctrine:schema:validate
php bin/console doctrine:migrations:migrate --no-interaction   # sur Postgres
vendor/bin/phpstan analyse && vendor/bin/php-cs-fixer fix --dry-run
php bin/phpunit
# Frontend
cd v2/shiftly-app
npm ci && npm run lint && npx tsc --noEmit && npm run build && npm run test
```

### Tests fonctionnels
- [ ] `docker compose up` lève `db` (healthy), `mailpit` (http://localhost:8025), `php`.
- [ ] L'API Symfony répond (route de santé ou page API Platform `/api`).
- [ ] La migration d'amorçage passe sur Postgres sans erreur.
- [ ] L'app Next démarre (`npm run dev`) et rend la page racine.
- [ ] CI verte sur une PR de test : jobs `backend` + `frontend` au vert.

### Critères d'acceptation
- [ ] Aucun `.env` réel committé, seulement `.env.example` (règle 12).
- [ ] Aucun moteur autre que Postgres dans compose ou CI (décision §4-2 + règle 13).
- [ ] TS en mode strict, aucun `any` (règle 2) ; aucune couleur hardcodée (règle 1).
- [ ] React Query + Zustand présents, aucun `fetch`/`useEffect` d'appel API (règle 5).
- [ ] Aucun code métier ajouté (anti-scope respecté).
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte.

### Auto-relecture du diff
`git diff main..HEAD` relu en hostile : un secret a-t-il fui ? le compose est-il
reproductible from scratch ? la CI échouerait-elle vraiment si une migration cassait
sur Postgres (sinon elle ne sert à rien) ? les scaffolds sont-ils bien minimaux ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques, convention `type(scope): summary`, dans l'ordre A → B → C → D
   (ex : `chore(infra): docker compose postgres + mailpit`, `chore(api): scaffold symfony 8 + api platform`,
   `chore(app): scaffold next 15 + tailwind 4 + providers`, `ci: backend + frontend verts`).
2. Rapport de vérification : cases cochées + preuves (`docker compose ps`, run migrations, run CI).
3. Tu push pas. Kévin push.

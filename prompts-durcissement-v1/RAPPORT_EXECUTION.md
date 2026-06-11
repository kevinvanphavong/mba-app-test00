# Rapport d'exécution — Durcissement V1 (paliers 0→4)

> Tenu par l'orchestrateur. Une section par palier livré (vert + committé + rapporté).

---

## Palier 0 — Infra Docker Postgres + CI — 2026-06-11

### Commits (atomiques)
- `5052ba5` chore(infra): docker-compose racine Postgres + Dockerfile.dev (pdo_pgsql)
- `d55e4ac` chore(db): squash des 37 migrations en 1 migration initiale Postgres
- `36a159e` style(api): normalisation php-cs-fixer @Symfony (passe mécanique, 129 fichiers)
- `2859011` chore(quality): phpstan niveau 6 (baseline legacy) + php-cs-fixer
- `b5cbaa9` fix(front): garde-fou registre appelé après les hooks (rules-of-hooks)
- `cb9c798` chore(front): setup Vitest + Testing Library + config ESLint
- `9fc701a` chore(ci): CI V1 (Postgres) + Makefile racine + MAJ CLAUDE.md (v2 gelée)

### Décisions prises
- **MySQL → PostgreSQL 16** partout (local Docker = CI). Le `DATABASE_URL` bascule dans
  `.env`, `.env.example` et `.env.local` (host). Le Dockerfile de prod (nginx/supervisor/
  Railway, encore `pdo_mysql`) **n'a pas été touché** — voir Risques.
- **Squash** : 37 migrations MySQL/SQLite supprimées → 1 migration initiale générée par
  `doctrine:migrations:diff` sur Postgres vierge. La régénération depuis les **entités**
  élimine d'office tout le SQL spécifique MySQL des anciennes migrations (information_schema,
  TINYINT(1), ENGINE=InnoDB, backticks, COLLATE…). `doctrine.yaml` était déjà prêt
  (`identity_generation_preferences: PostgreSQLPlatform: identity`).
- **Dockerfile.dev** séparé du Dockerfile prod (ce dernier reste la cible Railway).
- **PHPStan niveau 6 + baseline** (`phpstan-baseline.neon`, 214 erreurs legacy figées) :
  le nouveau code ne peut plus en ajouter.
- **PHP-CS-Fixer** : ruleset `@Symfony` **sans `declare_strict_types`** (volontaire : l'ajouter
  sur 17 600 LOC changerait le comportement runtime). Passe de normalisation appliquée
  (129 fichiers), commit isolé.
- **ESLint** n'était pas configuré côté front → ajout `next/core-web-vitals` ;
  `react/no-unescaped-entities` désactivé (apostrophes du copy FR).

### Vérifications (toutes vertes)
| Case | Résultat |
|---|---|
| `make up` → db healthy + mailpit + php | OK (`db Up (healthy)`, mailpit + php Up) |
| Migration initiale Postgres | OK — 1 migration, 217 requêtes |
| Fixtures Alice | OK — centre=10, user=83, mission=381, service=72 |
| `doctrine:schema:validate` | OK — mapping correct + BDD en phase |
| PHPUnit (legacy) | OK — 14 tests, 15 assertions |
| PHPStan (baseline) | OK — No errors |
| PHP-CS-Fixer dry-run | OK — 0 fichier à corriger |
| Front lint / tsc / vitest / build | OK — lint exit 0, tsc exit 0, vitest 5/5, build exit 0 |
| **App contre Postgres** | login `/api/auth/login` → **200** (JWT ROLE_MANAGER) ; `/api/me` → 200 ; `/api/dashboard/13` → 200 ; `/api/service/today?centreId=13` → 200 ; `/api/services` → 200 |

Identifiants de test (fixtures) : `fabrice@speedpark-bourges.fr` / `shiftly2026`.

### Risques / à retester manuellement
1. **Prod encore MySQL** : le `Dockerfile` de prod installe `pdo_mysql` et l'`.env.example`
   prod ciblait MySQL/Railway. La bascule Postgres ne couvre que **dev + CI**. Avant un
   déploiement, il faudra : provisionner une Postgres managée (Railway/Neon), passer le
   Dockerfile prod en `pdo_pgsql`, et adapter l'entrypoint. **Ne pas redéployer en l'état.**
2. **SQL natif paramétré non rejoué en prod-like** : `CompletionListener` (UPDATE service…
   missions_snapshot JSON) et `PlanningWeekDirtyListener` (UPDATE planning_week, dates
   `Y-m-d H:i:s`) sont paramétrés et passent le boot, mais leur exécution réelle n'a pas
   été couverte par un test dédié (ce sera fait au palier 3 lors de l'extraction). DQL
   `CASE WHEN` de `LeadRepository` : compile sur Postgres, non testé fonctionnellement.
3. **Conflit de port 5432 (machine de Kévin)** : un `postgresql@15` natif (Homebrew)
   masquait le port. **Arrêté** (`brew services stop postgresql@15`, réversible). S'il est
   relancé, l'app hôte retapera la mauvaise base. La Postgres de référence est celle de Docker.
4. **`react-hooks/exhaustive-deps`** : 4 warnings front subsistent (non bloquants). À traiter
   au fil de l'eau.
5. **Dépendances** : `composer audit` signale 34 advisories (11 paquets) et `npm` 15
   vulnérabilités — hérité, à traiter au palier 5 (mises à jour), hors scope palier 0.
6. Deux commits `feat(planning)` de Kévin (`a13061a`, `bd1028d`) sont arrivés en parallèle
   pendant le palier ; intacts, simplement reformatés par la passe cs-fixer. Aucune perte.

### Reste à faire avant le palier 1
- Aucun bloquant. Le palier 1 (auth cookie httpOnly + rate limiting) peut démarrer.

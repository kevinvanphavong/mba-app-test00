# Workflow des migrations Doctrine — Shiftly

> Référence rapide pour ne plus casser la prod Railway au push.
> Lié à la règle absolue n°15 du `CLAUDE.md`.

## Le problème (incident Railway 2026-04-25)

La prod Railway tourne sur **MySQL 8.0** (`Dockerfile` → `pdo_mysql`).
Tant que la BDD de dev était en **SQLite**, `doctrine:migrations:diff`
générait du SQL propre à SQLite : recréation complète de table via une
table intermédiaire `__temp__`, identifiants quotés à la SQLite, types
non portables. Ce SQL casse à l'exécution sur MySQL.

11 des 32 migrations existantes contiennent encore ce SQL SQLite non
portable — c'est l'historique, on n'y touche pas, mais on n'en crée plus.

## La règle (depuis la décision « PostgreSQL partout »)

> ⚠️ Mise à jour 2026 : le projet tourne désormais sur **PostgreSQL partout**
> (local Docker/Colima = CI = prod, cf. `CLAUDE.md` Stack — décision anti-incident).
> Les anciennes consignes MySQL/SQLite ci-dessus restent comme contexte historique
> de l'incident, mais ne sont **plus** la cible : ne plus utiliser `setup-mysql-local.sh`.

**Dev, CI et prod utilisent le même moteur : PostgreSQL 16.**
`.env.local` pointe sur `postgresql://...` (conteneur Docker `db`), jamais sur
`mysql://...` ni `sqlite://...`.

### Monter une base de zéro (vaut pour la CI et tout nouvel environnement)

```bash
cd shiftly-api
php bin/console doctrine:database:create --env=test --if-not-exists
php bin/console doctrine:migrations:migrate --no-interaction --env=test
php bin/console hautelook:fixtures:load --no-interaction --env=test   # données de test
```

## Générer une nouvelle migration

```bash
cd shiftly-api

# 1. Modifier les entités dans src/Entity/
# 2. Générer la migration (sur PostgreSQL local → SQL natif Postgres)
php bin/console doctrine:migrations:diff

# 3. RELIRE le fichier généré dans migrations/ :
#    - des ALTER TABLE, pas des DROP/CREATE de table complète
#    - up() ET down() cohérents (rejouables)
# 4. Appliquer en local
php bin/console doctrine:migrations:migrate

# 5. Tester l'app, puis commit (sans push)
```

## Checklist avant push Railway

- [ ] La migration a été générée sur MySQL local, pas SQLite
- [ ] Relue : aucun `__temp__`, aucun `CREATE TEMPORARY TABLE`
- [ ] `doctrine:migrations:migrate` passe sans erreur en local
- [ ] `up()` **et** `down()` sont cohérents
- [ ] Les fichiers de référence sont à jour (`schema.sql`, `ENTITES.md`)

## En cas de doute

Si une migration semble douteuse, la tester sur une base PostgreSQL jetable
(`--env=test`, voir « Monter une base de zéro ») avant push plutôt que de
découvrir le crash en prod.

## Réconciliation de l'historique — 2026-06-30 (lot 11→18/06)

**Contexte.** Les bases dev et test avaient été montées via `schema:create`
(depuis le mapping ORM), pas via les migrations : `doctrine_migration_versions`
était vide alors que les tables existaient déjà. 5 migrations apparaissaient donc
« not migrated » bien que leur schéma soit en place (`schema:validate` OK).

**Diagnostic.** Pour chacune des 5, vérification objet par objet en base réelle :
- `Version20260611000612` (tables absence/audit_log/centre/centre_note…),
  `Version20260618010207` (user.nom_naissance, numero_securite_sociale),
  `Version20260618012542` (table planning_note),
  `Version20260618013444` (table contrat) → **déjà appliquées** hors-suivi.
- `Version20260613044516` (`uniq_poste … NULLS NOT DISTINCT`) → l'index existait
  mais **sans** `NULLS NOT DISTINCT` (raffinement SQL Postgres absent du mapping,
  donc invisible pour `schema:validate`) → modif **non appliquée**.

**Décision (sans perte de données).**
- **Base de test (jetable)** : recréée de zéro + rejeu de **toutes** les migrations
  → 5/5 OK, `schema:validate` vert, fixtures rechargées, suite complète verte.
  Preuve qu'un nouvel environnement se monte proprement.
- **Dev (réaligner sans ré-altérer)** : `migrations:version --add` sur les 4
  déjà appliquées (métadonnées only) ; `migrations:execute --up` sur
  `Version20260613044516` (0 doublon exact → garde-fou OK, simple rebuild d'index,
  aucune ligne touchée).

> Règle qui en découle : **toujours monter les nouveaux environnements via les
> migrations** (cf. « Monter une base de zéro »), jamais via `schema:create`, pour
> que l'historique reste fidèle au schéma.

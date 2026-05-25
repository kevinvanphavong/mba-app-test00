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

## La règle

**Dev et prod utilisent le même moteur : MySQL 8.0.**
La mise en place locale se fait via `./setup-mysql-local.sh` (une fois).
`.env.local` doit pointer sur `mysql://...`, jamais sur `sqlite://...`.

## Générer une nouvelle migration

```bash
cd shiftly-api

# 1. Modifier les entités dans src/Entity/
# 2. Générer la migration (sur MySQL local → SQL natif MySQL)
php bin/console doctrine:migrations:diff

# 3. RELIRE le fichier généré dans migrations/ :
#    - aucune occurrence de __temp__ ni CREATE TEMPORARY TABLE
#    - des ALTER TABLE, pas des DROP/CREATE de table complète
#    - pas d'identifiant entre guillemets doubles "user" (style SQLite/PG)
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

Si une migration semble douteuse, la tester sur une base MySQL jetable
avant push plutôt que de découvrir le crash en prod.

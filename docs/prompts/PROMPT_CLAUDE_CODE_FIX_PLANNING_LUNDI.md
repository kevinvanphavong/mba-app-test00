# Prompt Claude Code — Fix planning : shifts du jour `weekStart` invisibles (SQLite vs MySQL)

> **Bug racine** : sur la page `/planning`, les shifts dont la date tombe **exactement sur le lundi de la semaine affichée** (`weekStart`) n'apparaissent pas dans la grille. Cause : paramètres `DateTimeImmutable` envoyés à Doctrine sans `Types::DATE_IMMUTABLE` → SQLite compare lexicographiquement et exclut la date d'égalité avec la borne basse.

---

## 1. Contexte du bug

Tu travailles sur **Shiftly** (SaaS de management opérationnel pour parcs de loisirs). Stack : Symfony 8 + API Platform (back), Next.js 14 (front), MySQL en local **mais .env dev en SQLite** (`var/data_dev.db`), MySQL/PostgreSQL en prod (Railway).

### Cas observé (reproductible aujourd'hui 2026-05-04)
- BDD : il existe en local un Poste pour Mickael Ferreira (user 792) sur le **lundi 4 mai 2026** : `service_id=674`, `zone_id=318` (Manager), `17:00–23:00`, pause 30min.
- API `GET /api/planning/week?centreId=85&weekStart=2026-05-04` retourne 6 shifts pour Mickael (mar→sam) **mais pas celui du lundi 4 mai**.
- API `GET /api/services?date[after]=2026-05-04&date[before]=2026-05-10` retourne bien les **7 services** dont le 674 du 4 mai.
- En BDD le service 674 existe (`SELECT id, date FROM service WHERE id=674` → `(674, '2026-05-04')`).
- Conséquence UI : la cellule Mickael × Lundi semble vide. Un drag-drop d'un autre jour vers cette cellule retourne 409 (contrainte `uniq_poste`) car le poste existe vraiment, mais le manager le voit comme "fantôme".

### Cause prouvée par test SQL
```sql
-- Reproduction sur var/data_dev.db (SQLite)
SELECT id, date FROM service
WHERE date BETWEEN '2026-05-04 00:00:00' AND '2026-05-10 00:00:00'
  AND centre_id = 85;
-- Retourne 6 lignes (5→10 mai). Le 4 mai EST EXCLU.

SELECT id, date FROM service
WHERE date BETWEEN '2026-05-04' AND '2026-05-10'
  AND centre_id = 85;
-- Retourne 7 lignes. Le 4 mai EST inclus.
```

Pourquoi : SQLite stocke `service.date` comme TEXT (`'2026-05-04'`, 10 chars) et compare lexicographiquement avec le paramètre Doctrine `'2026-05-04 00:00:00'` (19 chars). Char-by-char, `'2026-05-04'` < `'2026-05-04 00:00:00'` donc le BETWEEN exclut l'égalité basse. **MySQL/PostgreSQL avec un vrai type DATE ne souffrent pas du bug.**

### Le coupable exact

`shiftly-api/src/Repository/ServiceRepository.php:69-79` (`findBetween`) :
```php
->andWhere('s.date BETWEEN :from AND :to')
->setParameter('centreId', $centreId)
->setParameter('from', $from)   // ← MANQUE Types::DATE_IMMUTABLE
->setParameter('to', $to)       // ← MANQUE Types::DATE_IMMUTABLE
```

Le pattern correct existe déjà dans **PointageRepository, PlanningWeekRepository, PosteRepository, AbsenceRepository** :
```php
->setParameter('from', $from, Types::DATE_IMMUTABLE)
->setParameter('to',   $to,   Types::DATE_IMMUTABLE)
```

`findBetween` est appelé par `PlanningService::getWeekData` (ligne 76), qui alimente `/api/planning/week` → la grille planning.

---

## 2. Ton positionnement

- Développeur senior fullstack, code production-ready.
- **Strict respect des 15 règles absolues** du `CLAUDE.md` racine repo (lis-le en premier).
- **Règle 14** : commits atomiques après CHAQUE modif. Tu ne push pas. Kévin push.
- **Règle 15** : aucun artefact SQLite dans les migrations Doctrine. Mais ici il n'y a pas de migration — c'est un fix de code applicatif uniquement.
- **Règle 13** : mise à jour des fichiers de référence si modif structurelle. Ici probablement pas nécessaire (fix interne sans changement d'API publique), mais à vérifier.

---

## 3. Lecture obligatoire AVANT de coder

1. `CLAUDE.md` — conventions
2. `shiftly-api/src/Repository/ServiceRepository.php` — le coupable
3. `shiftly-api/src/Repository/PointageRepository.php` — référence du pattern correct (lignes 32-35)
4. `shiftly-api/src/Repository/PlanningWeekRepository.php` — autre référence
5. `shiftly-api/src/Repository/PosteRepository.php` — autre référence
6. `shiftly-api/src/Repository/AbsenceRepository.php` — autre référence
7. `shiftly-api/src/Service/PlanningService.php` — lignes 70-93 (`getWeekData`) ET ligne 968 (`s.date BETWEEN :from AND :to` à auditer aussi)
8. `shiftly-api/src/Controller/PlanningTemplateController.php` — ligne 101 (`s.date BETWEEN :from AND :to` à auditer aussi)
9. `shiftly-api/src/Controller/PlanningController.php` — `resolveMonday` (lignes 316-332) pour comprendre l'origine des `DateTimeImmutable`

**Ne code rien tant que tu n'as pas lu ces fichiers.**

---

## 4. Tâche — étapes ordonnées

### 4.1 Fix principal — `ServiceRepository::findBetween`

Dans `shiftly-api/src/Repository/ServiceRepository.php` :

1. Ajouter l'import si absent : `use Doctrine\DBAL\Types\Types;`
2. Modifier `findBetween` :
```php
->setParameter('from', $from, Types::DATE_IMMUTABLE)
->setParameter('to',   $to,   Types::DATE_IMMUTABLE)
```

→ **commit atomique** : `fix(api): force date_immutable type on ServiceRepository::findBetween (SQLite lex comparison bug)`

### 4.2 Audit complet de tous les `BETWEEN :from AND :to` du repo

Faire `grep -rn "BETWEEN :from AND :to\|BETWEEN :start\|BETWEEN :debut\|date BETWEEN" shiftly-api/src/`. Pour chaque résultat :

- Si le paramètre est un `DateTimeImmutable` ou `DateTime` ET que la colonne SQL est de type `DATE` (pas `DATETIME`) → **doit utiliser `Types::DATE_IMMUTABLE`**.
- Si le paramètre est déjà une string `'Y-m-d'` → OK, laisser tel quel.
- Si la colonne est `DATETIME` → `Types::DATETIME_IMMUTABLE` est correct.

À auditer **a minima** (déjà repérés) :
- `shiftly-api/src/Service/PlanningService.php:968` — vérifier le typage des paramètres `from`/`to` ligne 971-972
- `shiftly-api/src/Controller/PlanningTemplateController.php:101-104` — `setParameter('from', $monday)` et `setParameter('to', $weekEnd)` sans type

→ **un commit atomique par fichier corrigé**, message clair `fix(api): force date_immutable type on <Path>::<method>` avec dans le body la mention "même bug que ServiceRepository::findBetween — invisible MySQL, casse SQLite".

### 4.3 Test de non-régression manuel (obligatoire)

1. Lancer le serveur Symfony local (`symfony serve` ou `php -S`).
2. Lancer le front Next.js (`npm run dev` dans `shiftly-app/`).
3. Se logger en tant que manager du centre 85 (Family Games Center).
4. Aller sur `/planning`. Naviguer à la **semaine du lundi 4 mai 2026** (utiliser le bouton "Aujourd'hui" si on est en local le 2026-05-04, sinon flèches).
5. **Vérifier** : la cellule Mickael Ferreira × Lundi 4 mai contient bien un bloc Manager 17:00 → 23:00.
6. Si la cellule est toujours vide → le fix est incomplet, recommencer.

Tu colles dans ton rapport final un appel curl avec le résultat avant/après du fix :
```bash
# Avant fix : 4 shifts pour Mickael (mar→sam)
# Après fix : 5 shifts pour Mickael (lun→sam)
curl -s -H "Authorization: Bearer $JWT" \
  "http://localhost:8000/api/planning/week?centreId=85&weekStart=2026-05-04" \
  | jq '.employees[] | select(.prenom == "Mickael") | .shifts | length'
```

### 4.4 Vérifier l'absence d'autres effets de bord

Tester aussi :
- Page `/services` (liste) — déjà OK car utilise `findByCentreDesc` sans BETWEEN.
- Page `/dashboard` — vérifier que le service du jour s'affiche correctement.
- Endpoint `/api/planning/employee` — vérifier que la vue staff voit bien les shifts du lundi.
- Endpoint `/api/planning/export-pdf?weekStart=2026-05-04` — vérifier le PDF contient bien le shift du lundi.

---

## 5. Auto-vérification + auto-correction (obligatoire)

> **Tu t'auto-corriges.** Pas de livraison tant que ces points sont rouges.

### 5.1 Après chaque commit

Backend (`shiftly-api/`) :
```bash
php bin/console doctrine:schema:validate     # 0 erreur
php bin/console lint:container               # 0 erreur
php bin/console cache:clear --env=dev        # purge le cache Doctrine après modif
```

Frontend (`shiftly-app/`) — pas modifié ici, mais on vérifie que rien ne casse :
```bash
npm run lint
npm run build
```

### 5.2 Tests fonctionnels — rapport obligatoire

Pour chaque point ci-dessous, dis OUI/NON avec preuve (commande exécutée + sortie) :

- [ ] La requête SQL `SELECT date FROM service WHERE date BETWEEN '2026-05-04 00:00:00' AND '2026-05-10 00:00:00'` exclut bien le 4 mai (preuve du bug initial)
- [ ] Le fix Doctrine `Types::DATE_IMMUTABLE` génère le SQL avec la borne `'2026-05-04'` (sans heure) — vérifier en activant `php bin/console debug:doctrine:queries` ou en loggant la query
- [ ] Après fix, l'API `/api/planning/week?centreId=85&weekStart=2026-05-04` retourne le shift du lundi 4 mai pour Mickael (preuve : extrait JSON)
- [ ] Après fix, la cellule Mickael × Lundi 4 mai affiche bien le bloc Manager 17:00 → 23:00 dans l'UI (preuve : capture d'écran via Chrome DevTools ou screenshot)
- [ ] Le test sur `/api/planning/employee` (vue staff) passe aussi
- [ ] Aucun autre `BETWEEN :from AND :to` problématique ne reste dans `shiftly-api/src/` (preuve : `grep` complet)
- [ ] Aucun autre repository/service n'a été régressé : test rapide /dashboard + /service du jour fonctionne
- [ ] `php bin/console doctrine:schema:validate` passe

### 5.3 Critères d'acceptation finaux

Avant de déclarer terminé, OUI/NON avec fichier+ligne :

- [ ] `ServiceRepository::findBetween` utilise `Types::DATE_IMMUTABLE` ?
- [ ] L'import `use Doctrine\DBAL\Types\Types;` est présent dans tous les fichiers modifiés ?
- [ ] Tous les autres `BETWEEN :from AND :to` audités ont été corrigés ou validés OK ?
- [ ] Le bug est reproductible AVANT et corrigé APRÈS (test manuel sur localhost) ?
- [ ] Aucune régression sur les semaines hors lundi-de-semaine-actuelle (test sur 2026-04-27) ?
- [ ] Aucune `any` TypeScript introduite (règle 2) — N/A ici, fix backend pur
- [ ] Aucun `useEffect` API ajouté (règle 5) — N/A ici
- [ ] Tous les commentaires en français (règle 7) ?
- [ ] Mise à jour des docs si nécessaire — probablement non, fix interne ?

**Si une seule case NON → tu corriges et tu re-vérifies l'ensemble.**

### 5.4 Auto-relecture du diff

Avant livraison, `git diff main..HEAD` et relire en hostile :
- Le fix touche-t-il le minimum de surface ? (idéalement : ServiceRepository + 0 à 2 autres fichiers)
- Y a-t-il d'autres dates entre `weekStart` et `weekEnd` qui pourraient avoir le même bug si elles tombaient sur la borne ? (Non — seule la borne basse est concernée car `'2026-05-10' < '2026-05-10 00:00:00'` aussi, mais la borne haute n'est plus vraiment utile vu qu'on a déjà toutes les dates entre. Cela dit le fix protège quand même contre le cas borne haute.)
- Les SGBD prod (MySQL/PostgreSQL) restent compatibles ? (Oui — `Types::DATE_IMMUTABLE` produit `'YYYY-MM-DD'` qui est valide partout.)

---

## 6. Format de livraison attendu

À la fin, ta dernière réponse contient :

1. La **liste des commits** créés (un par fichier corrigé).
2. Le **rapport de vérification** avec tous les OUI/NON cochés et leurs preuves.
3. Le **diff final** récapitulatif.
4. Une **note** pour Kévin : "Push à toi de jouer. Tester en priorité sur la prod après push parce que le bug n'était visible qu'en local SQLite — donc le fix est invisible en prod, mais le risque de régression aussi est nul."

---

## 7. Ce que tu ne fais PAS

- **Pas de migration Doctrine** — c'est un fix code-only.
- **Pas de modif côté front** — le bug est 100% backend.
- **Pas de refactor large** — tu ne touches QUE les paramètres date BETWEEN qui passent un objet `DateTimeImmutable`/`DateTime` sans type. Tu ne réécris pas la méthode autour.
- **Pas de push Git.** Kévin push lui-même.
- **Pas de changement de schéma BDD.** La règle 15 du CLAUDE.md te rappelle qu'on ne crée pas de migration en local SQLite incompatible MySQL.
- **Pas de "fix défensif" ailleurs** — si tu vois d'autres bouts de code suspects mais hors-scope (ex : sérialisation de dates côté front, formats d'API), tu **listes** dans une note de fin sans les modifier.

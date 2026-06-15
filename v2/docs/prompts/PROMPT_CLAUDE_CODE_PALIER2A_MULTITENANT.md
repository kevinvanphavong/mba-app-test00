# Palier 2a — Modèle Centre/User + isolation multi-tenant + tests cross-tenant

> Poser le socle de sécurité de la v2 : entités `Centre` (tenant) et `User` (5 rôles),
> filtrage `centre_id` au niveau BDD **et** ressource, **prouvé par des tests
> d'isolation cross-tenant**. **Pas** le login/JWT (c'est 2b) — l'auth est simulée
> en test via `loginUser()`.

## Contexte
Palier 1 validé (infra Docker + Postgres OK). On attaque le palier 2 (auth + multi-tenant),
découpé en 2a (ce prompt : modèle + isolation), 2b (login JWT cookie), 2c (flags + profils).
L'isolation par `centre_id` est le garde-fou le plus dur à rattraper après coup → on le
pose et on le teste **en premier**, avant d'ajouter le flow d'auth réel.

## Décisions actées (ne pas rouvrir)
- **5 rôles hiérarchiques cumulatifs** : `ROLE_STAFF` < `ROLE_MANAGER` < `ROLE_DIRECTOR`
  < `ROLE_ADMIN` (le gérant, top du centre). `ROLE_SUPERADMIN` = **cross-centre**, à part.
- `STAFF`→`ADMIN` sont **scopés à leur `centre_id`**. `SUPERADMIN` **échappe** au filtre
  multi-tenant (voit tous les centres).
- `User.centre` est **nullable** (un SUPERADMIN n'est rattaché à aucun centre).
- Ceci **remplace** les 3 rôles annoncés dans `CLAUDE.md` → mettre à jour le règlement (règle 15).
- Auth réelle (login, JWT, cookie) = **palier 2b**, hors scope ici.

## Fichiers à lire avant de coder
- `CLAUDE.md` — règles 7, 9, 13, 15 + section Sécurité/Multi-tenant (à mettre à jour : 3→5 rôles).
- `../../shiftly-api/src/Doctrine/CentreQueryExtension.php` (v1) — pattern de filtrage BDD à réimplémenter proprement.
- `../../shiftly-api/src/Security/Voter/AbstractCentreVoter.php` (v1) — pattern Voter VIEW/EDIT/CREATE/DELETE.
- `../../shiftly-api/src/Entity/{User,Centre}.php` (v1) — champs de référence (ne pas tout copier).
- `../../shiftly-api/config/packages/security.yaml` (v1) — firewall/access_control de référence.
- `shiftly-api/config/packages/doctrine.yaml` (v2) — config Doctrine déjà en place.

## Tâche
1. **Entités** (`v2/shiftly-api/src/Entity/`) : `Centre` (id, nom, slug, timestamps) et
   `User` (id, email unique, password, `roles` json, `centre` ManyToOne **nullable**,
   timestamps). `User implements UserInterface, PasswordAuthenticatedUserInterface`.
2. **Marqueur multi-tenant** : interface `CentreAwareInterface` (getter `getCentre(): ?Centre`)
   + l'appliquer à `User`. Servira à enregistrer les entités scopées dans l'extension.
3. **Migration** Postgres (testée via Docker/colima, règle 13).
4. **`CentreQueryExtension`** (API Platform `QueryCollectionExtensionInterface` +
   `QueryItemExtensionInterface`) : ajoute `WHERE centre_id = :current` sur toute entité
   `CentreAwareInterface`, **sauf si l'utilisateur courant a `ROLE_SUPERADMIN`** (bypass).
   Logique d'accès au user courant dans un **service** dédié, pas dans l'extension (règle 7).
5. **`AbstractCentreVoter`** (VIEW/EDIT/CREATE/DELETE) : refuse si la ressource n'appartient
   pas au centre du user ; `SUPERADMIN` autorisé partout. Un `UserVoter` concret qui en hérite.
6. **Exposition API Platform** de `User` (au moins `GET` collection + item) pour rendre
   l'isolation testable. Pas d'écriture exposée ici (création de users = plus tard).
7. **`security.yaml` v2** : `role_hierarchy` cumulative des 5 rôles + `password_hashers`
   (bcrypt/argon2). Pas de firewall JWT complet ici (2b) — config minimale pour les tests.
8. **Mettre à jour `CLAUDE.md`** : section rôles 3→5 + note SUPERADMIN cross-centre.

## Ce qu'il ne fait PAS (anti-scope)
- Pas de login / endpoint `/auth/login` / JWT Lexik / cookie / CSRF / rate-limit (→ 2b).
- Pas de feature flags ni profils secteur / seeds (→ 2c).
- Pas de front, pas d'écran.
- Pas d'entité métier (Poste, Mission… = palier 3).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Commandes
```bash
cd v2 && colima start 2>/dev/null; docker compose up -d
docker compose exec -T php php bin/console doctrine:migrations:migrate -n
docker compose exec -T php php bin/console doctrine:schema:validate
docker compose exec -T php php bin/console lint:container
docker compose exec -T php vendor/bin/phpstan analyse
docker compose exec -T php vendor/bin/php-cs-fixer fix --dry-run --diff
docker compose exec -T php php bin/phpunit
```

### Tests fonctionnels — l'isolation est le cœur (auth simulée via loginUser)
- [ ] **Cross-tenant collection** : un `MANAGER` du centre A qui liste `/api/users` ne voit
      QUE les users du centre A (jamais ceux de B).
- [ ] **Cross-tenant item** : ce même manager qui `GET /api/users/{id_de_B}` reçoit **404/403**.
- [ ] **Bypass superadmin** : un `SUPERADMIN` liste `/api/users` et voit A **et** B.
- [ ] **Voter** : EDIT d'un user de B par un user de A refusé ; autorisé pour SUPERADMIN.
- [ ] **Hiérarchie** : un `DIRECTOR` possède bien `ROLE_MANAGER` et `ROLE_STAFF` (test sur le role_hierarchy).

### Critères d'acceptation
- [ ] Migration rejouée sur Postgres sans erreur ; `schema:validate` vert.
- [ ] `centre_id` jamais court-circuité ; `SUPERADMIN` est la seule exception, explicite (règle 9).
- [ ] Aucune logique métier dans l'extension/le voter au-delà de l'autorisation (règle 7).
- [ ] `CLAUDE.md` mis à jour (5 rôles) dans le même échange (règle 15).
- [ ] PHPStan + CS-Fixer + PHPUnit verts. Aucun `any` équivalent / pas de couleur (N/A back).

### Auto-relecture du diff
`git diff` relu en hostile : existe-t-il **un seul** chemin où une collection scopée
échappe au filtre `centre_id` hors SUPERADMIN ? le user courant est-il résolu proprement
(pas de fuite si non authentifié) ? la migration est-elle réversible ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques (ex : `feat(tenant): entités Centre + User 5 rôles`,
   `feat(tenant): CentreQueryExtension + AbstractCentreVoter`,
   `test(tenant): isolation cross-tenant`, `docs: CLAUDE.md 5 rôles`).
2. Rapport : sortie des tests d'isolation (les 5 cases) + `migrations:status` + PHPStan.
3. Tu push pas. Kévin push.

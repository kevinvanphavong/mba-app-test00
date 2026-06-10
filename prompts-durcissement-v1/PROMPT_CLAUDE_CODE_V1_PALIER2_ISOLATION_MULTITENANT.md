# Palier 2 — Isolation multi-tenant complète + tests cross-tenant

> Boucher les trous d'isolation (≈18 entités sans Voter) et **prouver** l'isolation
> par une suite de tests cross-tenant en CI.

## Contexte
`CentreQueryExtension` couvre 16 entités et `AbstractCentreVoter` a 8 implémentations,
mais ~18 entités exposées n'ont pas de voter dédié (Absence, Pointage, PlanningWeek,
PlanningTemplate*, ValidationHebdo, Media, SupportTicket/Reply/Attachment, CentreNote,
AuditLog…). Aucun test ne prouve l'isolation. C'est le prérequis pour signer un client.
Prérequis : paliers 0-1 livrés.

## Fichiers à lire avant de coder
- `shiftly-api/src/Doctrine/CentreQueryExtension.php` — entités couvertes
- `shiftly-api/src/Security/Voter/AbstractCentreVoter.php` — pattern à décliner
- `shiftly-api/src/Entity/` — inventaire complet (34 entités)
- `shiftly-api/config/packages/security.yaml` — access_control
- `shiftly-api/fixtures/` — pour les fixtures de test 2 centres
- `PLAN_DURCISSEMENT_V1.md` — palier 2

## Tâche
1. **Inventaire** : tableau entité → exposée API ? → couverte par l'extension ? →
   voter ? Le committer dans `docs/SECURITE_MULTITENANT.md` (c'est la doc du domaine).
2. Combler `CentreQueryExtension` : toute entité exposée rattachable à un centre
   (directement ou par jointure) doit être filtrée. Cas particuliers à documenter
   (Centre lui-même, Lead public, entités superadmin).
3. Créer les voters manquants (héritant d'`AbstractCentreVoter`) + les brancher
   (attribut `security:` API Platform ou `denyAccessUnlessGranted` dans les
   controllers custom concernés).
4. Audit des **controllers custom** : repérer toute requête repository qui ne filtre
   pas par le centre du user courant ; corriger.
5. **Suite de tests cross-tenant** (`tests/Security/CrossTenantTest.php`) : fixtures
   2 centres (A/B) + 1 user par centre ; pour **chaque ressource exposée** :
   - collection : user A ne voit que les données A ;
   - item B demandé par user A → 404/403 ;
   - écriture (PATCH/DELETE) sur ressource B par user A → 403.
   Génère les cas par itération sur l'inventaire du point 1 (data provider), pas à la main.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php vendor/bin/phpunit --testsuite=default
docker compose exec php php bin/console lint:container
docker compose exec php vendor/bin/phpstan analyse
```

- [ ] Inventaire committé : zéro entité exposée sans décision explicite (filtrée / publique justifiée)
- [ ] Suite cross-tenant verte : chaque ressource testée en lecture collection + item + écriture
- [ ] Superadmin : bypass vérifié par test (voit A et B)
- [ ] Aucun controller custom ne court-circuite le filtre (grep `findBy`/`findAll` audités)
- [ ] CI verte complète
- [ ] Parcours manuel : app inchangée pour un user normal (pas de régression fonctionnelle)

## Livraison
1. Commits atomiques (`feat(security): voters …`, `test(security): cross-tenant …`, `docs: …`)
2. Rapport : inventaire + nombre de cas de test générés + trous réellement trouvés/corrigés
3. Note de risque : tout trou découvert en prod-like à signaler en premier
4. Tu push pas. Kévin push.

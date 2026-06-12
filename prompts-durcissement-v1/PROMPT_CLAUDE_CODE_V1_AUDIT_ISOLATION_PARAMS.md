# Audit isolation — tous les paramètres qui résolvent une entité par ID

> Étendre l'audit cross-tenant au-delà du `centre_id` : tout param de route ou query
> (`?userId=`, `?serviceId=`, `{id}`, `zoneId`, `posteId`…) qui résout une entité ne
> doit jamais exposer les données d'un autre tenant.

## Contexte
L'audit horaires + EditeurController a déjà fermé 14 fuites (cf. `CentreGuardTrait`,
suite cross-tenant étendue). Reste l'angle non couvert : les controllers custom qui
acceptent un **autre identifiant** qu'un centre. Un manager du centre A ne doit jamais
lire/écrire une entité du centre B en passant son ID, quel que soit le nom du paramètre.

## Décision actée (le critère de sûreté)
Pour chaque route à param résolvant une entité, **deux** issues sont acceptables, mais
chacune doit être **prouvée par un test**, jamais supposée :
1. param d'un autre tenant → **403/404** (garde explicite, ex. `CentreGuardTrait`) ; ou
2. param **ignoré** au profit du filtre JWT/`CentreQueryExtension` (ex. `?centreId=`
   sur `/api/zones` renvoie les zones du user, pas celles demandées).

Une route qui renvoie 200 **avec les données d'un autre centre** = fuite à corriger.

## Fichiers à lire avant de coder
- `shiftly-api/src/Security/CentreGuardTrait.php` — la garde réutilisable existante
- `shiftly-api/src/Doctrine/CentreQueryExtension.php` — ce qui est déjà filtré par JWT
- `shiftly-api/src/Controller/` — inventaire des routes custom (focus EditeurController,
  PointageController, PlanningController/Template, ValidationController, SupportController)
- `shiftly-api/tests/Security/CrossTenantTest.php` — suite à étendre
- `prompts-durcissement-v1/RAPPORT_EXECUTION.md` — risque n°9 (contexte)

## Tâche
1. **Inventaire** : lister toute route custom dont un param (route ou query) résout une
   entité — `userId`, `serviceId`, `zoneId`, `posteId`, `missionId`, `incidentId`,
   `competenceId`, `tutorielId`, `absenceId`, etc. Committer le tableau dans
   `docs/SECURITE_MULTITENANT.md` (route → param → entité résolue → garde ou filtre JWT → statut).
2. **Vérifier chaque route ligne par ligne** (ne pas se fier à un audit auto — il avait
   classé 2 routes editeur "OK" à tort). Pour chacune : la cible appartient-elle
   forcément au centre du user ?
3. **Corriger** les fuites : appliquer `CentreGuardTrait::denyUnlessOwnCentre()` (ou
   l'équivalent) sur tout chemin qui charge une entité par ID sans vérifier son centre.
   SUPERADMIN bypass conservé.
4. **Tests** : étendre `CrossTenantTest` — pour chaque route inventoriée, un cas
   « param pointant vers le centre B, requête par user du centre A » asserte soit 403/404,
   soit (cas filtre JWT) un payload ne contenant **aucune** entité du centre B.

## Ce qu'il ne fait PAS (anti-scope)
- Pas de refactor des controllers en State Processors (c'est le palier 5).
- Pas de modif fonctionnelle : un user légitime sur **son** centre doit garder le même comportement.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php vendor/bin/phpunit --testsuite=default
docker compose exec php vendor/bin/phpstan analyse
docker compose exec php vendor/bin/php-cs-fixer fix --dry-run
```

- [ ] Inventaire committé : zéro route à param sans statut explicite (garde ou filtre JWT prouvé)
- [ ] Chaque fuite trouvée → corrigée + couverte par un test cross-tenant
- [ ] Cas « filtre JWT » prouvés (payload sans entité du centre B), pas seulement le code HTTP
- [ ] SUPERADMIN : accès cross-centre toujours vert (test)
- [ ] Aucune régression pour un user sur son propre centre (relire le diff en hostile)
- [ ] phpunit + phpstan + cs-fixer verts

## Livraison
1. Commits atomiques (`fix(security): garde param X …`, `test(security): isolation params …`, `docs: …`)
2. Rapport : inventaire + nombre de fuites réellement trouvées/corrigées + nb de cas de test ajoutés
3. Note de risque : toute route volontairement laissée ouverte (et pourquoi)
4. Tu push pas. Kévin push.

# Palier 3 — Messenger pour les effets de bord + listeners assainis

> Passer les opérations coûteuses (mails, cleanup R2, PDF, audit log) en asynchrone
> et sortir la logique métier des listeners Doctrine.

## Contexte
Tout est synchrone : un mail ou un cleanup R2 qui échoue bloque ou casse la requête.
13 listeners Doctrine, dont 3 contiennent de la vraie logique métier avec bypass DBAL
de l'UnitOfWork. Prérequis : paliers 0-2 livrés.

## Décisions actées (ne pas rouvrir)
- Transport Messenger **Doctrine** (pas de Redis/RabbitMQ à ce stade) + retry 3x.
- Les listeners de cleanup peuvent rester des listeners, mais ils **dispatchent un
  message** au lieu d'appeler R2 en synchrone.
- La logique métier extraite va dans des **services** appelés explicitement
  (controller/processor), plus jamais déclenchée par introspection UoW.

## Fichiers à lire avant de coder
- `shiftly-api/src/EventListener/CompletionListener.php` — recalcul taux_completion + bypass DBAL
- `shiftly-api/src/EventListener/HaccpProofConformityChecker.php` — conformité thermométrie
- `shiftly-api/src/EventListener/PlanningWeekDirtyListener.php` — introspection UoW
- `shiftly-api/src/EventListener/MediaR2CleanupListener.php` — pattern des 5 listeners cleanup
- `shiftly-api/src/Service/R2StorageService.php` + services Mail — appels à rendre async
- `shiftly-api/config/packages/` — config messenger à créer

## Tâche
1. Installer `symfony/messenger`, transport Doctrine (`async`), retry 3x backoff,
   `failure_transport`. Cible Makefile `worker` + doc 3 lignes dans `docs/`.
2. Messages + handlers : `SendMailMessage`, `CleanupR2ObjectMessage`,
   `GeneratePdfMessage` (si la génération est différable — sinon laisser sync et le dire),
   `LogAuditEventMessage`.
3. Les 5 listeners cleanup → dispatchent `CleanupR2ObjectMessage` (suppression idempotente).
4. **Extraction métier** :
   - `CompletionListener` → `CompletionRateCalculator` (service testé), recalcul
     déclenché explicitement au point d'écriture (controller/processor), plus de bypass DBAL ;
   - `HaccpProofConformityChecker` → `HaccpConformityService` appelé à la création de la preuve ;
   - `PlanningWeekDirtyListener` → service de marquage appelé aux points de mutation du planning.
5. Tests unitaires des 3 services extraits + test d'intégration : un mail part via le
   worker (Mailpit), un cleanup R2 échoué est retenté.

## Auto-vérification (obligatoire)
> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

```bash
docker compose exec php php bin/console messenger:stats
docker compose exec php php bin/console messenger:consume async --limit=10 -vv
docker compose exec php vendor/bin/phpunit && vendor/bin/phpstan analyse
```

- [ ] Plus aucune logique métier dans un listener (`grep -r "UnitOfWork\|getScheduled" src/EventListener` → cleanup only)
- [ ] Plus aucun update DBAL direct dans un listener
- [ ] Taux de complétion : résultat identique avant/après extraction (test de non-régression chiffré)
- [ ] Conformité HACCP : mêmes verdicts sur les fixtures qu'avant
- [ ] Worker consomme mails + cleanups ; échec → retry → failed transport
- [ ] CI verte ; parcours manuel : cocher/décocher une mission → taux à jour

## Livraison
1. Commits atomiques (`feat(async): messenger …`, `refactor(domain): extraction …`)
2. Rapport : cases + preuve de non-régression des calculs
3. Note de risque : le worker doit tourner en prod (documenter la commande/supervision)
4. Tu push pas. Kévin push.

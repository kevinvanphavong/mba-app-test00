# EventLog — Traçabilité append-only des Completions

> Crée la fondation événementielle de Shiftly. Premier consommateur : historique des coches/décoches de missions, exposé en analytics sur `/dashboard`. Conçu pour être réutilisé par HACCP en Phase 2.

## Contexte

Aujourd'hui un `DELETE /api/completions/{id}` efface la ligne sans laisser de trace → on perd l'historique. Ce chantier ajoute une table `event_log` append-only alimentée par un Doctrine listener sur Completion (CHECK / UNCHECK), plus un endpoint analytics agrégé pour le dashboard manager. Aucun changement dans les controllers existants.

## Décisions actées (ne PAS remettre en cause)

- **Append-only strict** : aucune route `POST/PATCH/DELETE` exposée sur `event_log`. Seuls `GET` collection et item, MANAGER uniquement.
- **Polymorphe d'emblée** : `entityType` + `action` + `payload` JSON, même si on n'instrumente que Completion pour l'instant.
- **Pas de backfill** des Completions existantes — on démarre à blanc au déploiement.
- **Snapshot payload léger** : 8 clés max (cf. §4 de `EVENTLOG_MODULE.md`). Pas plus.
- **MANAGER only** côté lecture. Un employé reçoit 403.
- **Pas d'UI SuperAdmin / export PDF dans ce chantier** — voir §12 hors scope de la spec.
- **Bloc historique sur `/dashboard` existant**, pas de route dédiée.

## Fichiers à lire avant de coder

- `CLAUDE.md` — règles absolues (cf. règles 1, 5, 13, 14, 15)
- `docs/modules/EVENTLOG_MODULE.md` — **spec complète, source de vérité de ce chantier**
- `docs/maquettes/dashboard-history.html` — UI cible (3 widgets + drill-down)
- `shiftly-api/src/Entity/Completion.php` — point d'attache du listener (postPersist/preRemove)
- `shiftly-api/src/Controller/DashboardController.php` — y ajouter l'endpoint `completionHistory`
- `shiftly-app/src/app/(app)/dashboard/page.tsx` + `shiftly-app/src/hooks/useDashboard.ts` — page front à étendre

## Tâche

### Backend

1. Créer l'entité `App\Entity\EventLog` selon §3 de `EVENTLOG_MODULE.md` (champs, index composés, constantes, ApiResource lecture seule, Voter `VIEW`).
2. Créer le repository `EventLogRepository` avec deux méthodes : `findCompletionHistory(Centre, \DateTimeImmutable $from, \DateTimeImmutable $to): array` (agrégats KPI + zones + missions oubliées + ranking staff) et `findEventsForService(Centre, int $serviceId): array` (timeline drill-down).
3. Créer le listener `App\EventListener\CompletionEventLogger` (§5 de la spec) — résoudre `centre` via `Poste → Zone → Centre`, payload à 8 clés exactement.
4. Créer le Voter `EventLogVoter` cloisonnement strict par centre (cf. `CompletionVoter` comme modèle).
5. Ajouter dans `DashboardController` une route `#[Route('/api/dashboard/completion-history', methods: ['GET'])]` qui appelle le repository et renvoie le JSON spécifié §7 de la spec. Cache HTTP `private, max-age=60`.
6. Migration Doctrine : `make:migration` puis **relire le SQL généré** avant commit — voir §Notes techniques.
7. Pas de fixture sur `event_log` (table alimentée par les listeners au runtime).

### Frontend

8. Hook `useCompletionHistory(period: '7d'|'30d'|'90d')` dans `shiftly-app/src/hooks/` — React Query, types stricts depuis `src/types/eventlog.ts` (à créer).
9. Composant `<HistorySection />` dans `shiftly-app/src/components/dashboard/history/` — découper en sous-composants ≤ 150 lignes : `PeriodToggle`, `KpiRow`, `ZonesDonut`, `MissionsForgotten`, `StaffRanking`, `RecentServicesList`, `ServiceDrillDownModal`.
10. Intégrer `<HistorySection />` dans `dashboard/page.tsx` **sous le bloc Service du jour**, manager uniquement (cf. role guard existant).
11. Donut SVG inline (cf. maquette) OU Recharts si déjà importé ailleurs. Animations Framer Motion via les variants existants de `lib/animations.ts`.
12. Loading skeleton, error state, empty state (`<EmptyState />` existant) sur chaque widget.

## Notes techniques

- **Règle absolue #15 — Migration MySQL/PostgreSQL portable.** La table `event_log` utilise `json`, `bigint` et 3 index composés. Vérifie que la migration générée ne contient ni `__temp__` (SQLite), ni quoting `"user"`. Test : `php bin/console doctrine:migrations:migrate` en environnement MySQL local AVANT push.
- **JSON_EXTRACT** : les requêtes du repo utilisent `JSON_EXTRACT(payload, '$.zoneNom')` (MySQL) ou `payload->>'zoneNom'` (PostgreSQL). Choisis le dialecte courant via `$em->getConnection()->getDatabasePlatform()->getName()` OU expose deux variantes du repository OU plus simple : abandonne JSON_EXTRACT, hydrate les events en PHP et agrège côté code (~quelques milliers de lignes / mois, ok). **Recommandation : agrégation PHP** pour rester portable et simple.
- **Listener en CLI** : `$this->security->getUser()` retourne `null` en CLI (fixtures). Le listener doit retomber sur `Completion::getUser()` puis tolérer `null` (cf. §5 de la spec).
- **Cascade onDelete** : `user_id`, `poste_id`, `mission_id` en `SET NULL` — préserver l'historique si suppression future de l'entité d'origine.
- **Pas de fuite cross-tenant** : le Voter + le filtre auto du provider API Platform doivent tous les deux être en place. Teste avec deux managers de centres différents.

## Anti-scope

- ❌ Ne touche pas au flux POST/DELETE Completion existant (le listener s'auto-déclenche).
- ❌ N'ajoute pas de PATCH/DELETE sur EventLog.
- ❌ Pas de vue SuperAdmin / export PDF / webhook — Phase 2.
- ❌ Pas d'instrumentation HACCP/Pointage/Incident dans ce chantier.
- ❌ Pas de job cron de rétention 3 ans dans ce chantier — Phase 2 (mais documente la stratégie dans `EVENTLOG_MODULE.md` §11, déjà fait).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-api
php bin/console doctrine:schema:validate
php bin/console lint:container
php bin/console doctrine:migrations:migrate --dry-run

cd ../shiftly-app
npm run lint && npm run build
```

### Tests fonctionnels manuels
- [ ] `POST /api/completions` → vérifier qu'une ligne `event_log` apparaît avec `action='CHECK'` et `payload` non vide (8 clés)
- [ ] `DELETE /api/completions/{id}` → vérifier qu'une ligne `action='UNCHECK'` apparaît (et que la Completion est bien supprimée)
- [ ] Login employé → `GET /api/event_logs` → **403**
- [ ] Login manager centre A → `GET /api/event_logs` ne retourne **aucun** event du centre B (test deux centres en fixtures)
- [ ] `GET /api/dashboard/completion-history?from=2026-05-01&to=2026-05-30` → JSON conforme §7 de la spec
- [ ] `/dashboard` côté manager : bloc Historique visible, 3 widgets affichent, drill-down ouvre la modale
- [ ] `/dashboard` côté employé : bloc Historique **absent**
- [ ] États loading/error/empty visibles (couper le backend pour valider error, vider la table pour valider empty)

### Critères d'acceptation
- [ ] Les 11 critères du §13 de `EVENTLOG_MODULE.md` cochés
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte (notamment 5 = React Query only, 6 = 3 états, 8 = pas de métier dans le JSX, 14 = multi-tenant via Voter, 15 = migration portable)
- [ ] `npm run build` + `doctrine:schema:validate` passent sans warning
- [ ] `ARCHITECTURE.md`, `ENTITES.md`, `schema.sql` mis à jour dans le **même commit** que la création de l'entité

### Auto-relecture du diff
Avant livraison, `git diff main..HEAD` et relis en hostile :
- Le listener fonctionne-t-il en CLI (fixtures) sans crasher ?
- Un manager peut-il fouiller dans le centre du voisin via un id direct ?
- La migration tourne-t-elle proprement sur **MySQL** ET ce qu'elle générera sur PostgreSQL Railway ?
- Y a-t-il un seul `useEffect` pour les API ? une seule couleur hardcodée ? un seul `any` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison

1. Commits atomiques séparés :
   - `feat(eventlog): entité + repository + voter + migration`
   - `feat(eventlog): listener Completion (postPersist + preRemove)`
   - `feat(dashboard): endpoint /api/dashboard/completion-history`
   - `feat(dashboard): bloc Historique services (front)`
   - `docs(eventlog): mise à jour ARCHITECTURE / ENTITES / schema.sql`
2. Rapport final : cases cochées + extrait `git log --oneline` + screenshots des 3 widgets sur /dashboard
3. Note de risque : "Tester en priorité après déploiement Railway que la migration JSON+index passe sur PostgreSQL prod"
4. Tu push pas. Kévin push.

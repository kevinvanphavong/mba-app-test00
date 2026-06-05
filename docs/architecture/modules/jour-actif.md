# Jour actif (« service du jour ») — bascule à 5h

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md)

Le « jour actif » d'un centre n'est pas le jour calendaire : il bascule à **5h du matin** (timezone `Europe/Paris`) pour gérer les services de nuit / fermetures tardives. Entre 0h et 4h59, on est encore dans la journée d'exploitation de la veille ; à 5h00 pile, on bascule sur le jour calendaire courant. Cette règle régit `EN_COURS` sur les pages `/service`, `/dashboard` et `/services` — **les trois doivent répondre la même chose à la même heure**.

### Source de vérité backend

`App\Service\ActiveDayResolver` est la **source unique** côté API. Toute fonction qui détermine « le service du jour » DOIT passer par lui :

- `getActiveDate(?\DateTimeImmutable $now = null): \DateTimeImmutable` → date à 00:00 dans la timezone Paris.
- `getActiveDateString(?\DateTimeImmutable $now = null): string` → format `YYYY-MM-DD` pour les payloads JSON.

Le paramètre `$now` optionnel permet d'injecter une date fixe en test (cf. `tests/Service/ActiveDayResolverTest.php`).

Constante exposée : `ActiveDayResolver::NIGHT_SHIFT_HOUR = 5`. Timezone forcée explicitement (ne dépend pas de `date.timezone` du `php.ini`).

### Backend — fichiers qui en dépendent

| Fichier | Usage |
|---|---|
| `src/Service/ServiceStatutResolver.php` | Résolution dynamique PLANIFIE / EN_COURS / TERMINE |
| `src/Repository/ServiceRepository.php` (`findToday`, `findTodayActive`) | Lookup du service du jour pour `/api/service/today` et `/api/dashboard/{id}` |
| `src/Service/PlanningGuardService.php` (`getMinAllowedDate`) | Garde-fou « pas de modif dans le passé » (création poste, apply template, etc.) |
| `src/Controller/StaffController.php` (`getPresentUserIds`) | Liste des présents du service EN_COURS |
| `src/Service/PlanningService.php` (`getEmployeeWeeks`) | Lundi de la semaine courante côté staff |

**Non concerné** : `PlanningService::calculateDelaiPrevenance` continue d'utiliser `new DateTimeImmutable('today midnight')` car le délai de prévenance IDCC 1790 est défini en jours calendaires légaux, pas en jours d'exploitation.

### Source de vérité frontend

`shiftly-app/src/lib/serviceUtils.ts` exporte `NIGHT_SHIFT_HOUR = 5` qui **doit rester synchronisée** avec `ActiveDayResolver::NIGHT_SHIFT_HOUR`. La fonction `getEffectiveToday()` lit cette constante.

### Évolutions prévues

V2 (non implémentée) : rendre le seuil configurable par centre via un champ `Centre.serviceRolloverHour`. La signature actuelle de `ActiveDayResolver` est déjà compatible (paramètre `$now` injectable, ajout futur d'un `?Centre $centre` direct).

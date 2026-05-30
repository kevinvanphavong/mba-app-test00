# Module EventLog — Spécifications MVP

> Spec de la **fondation événementielle** de Shiftly.
> Premier consommateur : historique des coches/décoches de missions (Completion).
> Conçu pour être réutilisé par HACCP, Pointage, Incident en Phase 2.
> Destiné à être lu par Claude Code avant l'implémentation.

---

## 1. Concept

`EventLog` est une **table append-only** qui consigne chaque action métier significative
sur Shiftly, avec horodatage, auteur, contexte multi-tenant et payload JSON.

> Append-only = aucune mise à jour, aucune suppression. C'est ce qui rend la trace
> opposable à un contrôle (DDPP, prud'hommes, audit interne).

Premier cas d'usage : **traçabilité des Completions** (qui a coché / décoché quelle mission, quand, sur quel poste). Aujourd'hui le `DELETE /api/completions/{id}` efface la ligne sans laisser de trace → on perd l'historique. Avec `EventLog`, chaque `CHECK` et `UNCHECK` est consigné de manière immuable.

**Ce que ce module n'est PAS :**
- Pas une refonte event-sourcing du projet (Doctrine CRUD reste maître)
- Pas une stack Kafka/RabbitMQ (table MySQL/PostgreSQL classique)
- Pas un backfill rétroactif des Completions existantes (on démarre "à blanc")
- Pas un export UI à ce stade (Phase 2)

---

## 2. Pourquoi maintenant

| Bénéfice immédiat | Bénéfice différé (3-6 mois) |
|---|---|
| Trace coche/décoche missions | Fondation prête pour HACCP (températures, nettoyages, allergènes) |
| Analytics "missions oubliées" sur /dashboard | Argument commercial "traçabilité audit-proof" pour propals ≥ Pro |
| Aide à arbitrer un litige RH | Export DDPP par centre côté SuperAdmin |
| Suppression de la perte d'info au décochage | Replay possible d'un service pour debug |

Coût estimé : **2 jours de dev** (entité + listener + endpoint + 1 widget dashboard).

---

## 3. Entité EventLog

```php
namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\EventLogRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Journal append-only des événements métier.
 * - Aucun POST / PATCH / DELETE exposé : l'écriture est faite par les listeners.
 * - Lecture seule via API Platform, filtrée multi-tenant par le Voter.
 */
#[ORM\Entity(repositoryClass: EventLogRepository::class)]
#[ORM\Table(name: 'event_log')]
#[ORM\Index(columns: ['centre_id', 'entity_type', 'occurred_at'], name: 'idx_eventlog_centre_type_date')]
#[ORM\Index(columns: ['centre_id', 'user_id', 'occurred_at'],     name: 'idx_eventlog_centre_user_date')]
#[ORM\Index(columns: ['poste_id'],                                 name: 'idx_eventlog_poste')]
#[ApiResource(
    normalizationContext: ['groups' => ['eventlog:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'centre'      => 'exact',
    'entityType'  => 'exact',
    'action'      => 'exact',
    'user'        => 'exact',
    'poste'       => 'exact',
    'mission'     => 'exact',
])]
#[ApiFilter(DateFilter::class, properties: ['occurredAt'])]
class EventLog
{
    public const ENTITY_COMPLETION = 'completion';
    public const ACTION_CHECK   = 'CHECK';
    public const ACTION_UNCHECK = 'UNCHECK';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column(type: 'bigint')]
    #[Groups(['eventlog:read'])]
    private ?string $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['eventlog:read'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 50)]
    #[Groups(['eventlog:read'])]
    private string $entityType;

    #[ORM\Column(nullable: true)]
    #[Groups(['eventlog:read'])]
    private ?int $entityId = null;

    #[ORM\Column(length: 20)]
    #[Groups(['eventlog:read'])]
    private string $action;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['eventlog:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Poste::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['eventlog:read'])]
    private ?Poste $poste = null;

    #[ORM\ManyToOne(targetEntity: Mission::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['eventlog:read'])]
    private ?Mission $mission = null;

    /**
     * Snapshot minimal pour résister aux suppressions futures.
     * Exemple : { "missionNom": "Vider la corbeille", "zoneNom": "Bar",
     *             "priorite": "important", "userNom": "Sophie L." }
     */
    #[ORM\Column(type: 'json')]
    #[Groups(['eventlog:read'])]
    private array $payload = [];

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['eventlog:read'])]
    private \DateTimeImmutable $occurredAt;

    public function __construct()
    {
        $this->occurredAt = new \DateTimeImmutable();
    }

    // Getters / setters classiques — omis pour la spec
}
```

**Champs clés :**

| Champ | Type | Rôle |
|---|---|---|
| `centre` | FK Centre | Cloison multi-tenant — **toujours indexée** |
| `entityType` | string(50) | Discriminant : `completion` aujourd'hui, `haccp_check` / `pointage_event` demain |
| `entityId` | int nullable | Id de l'objet d'origine (nullable car peut avoir été supprimé) |
| `action` | string(20) | `CHECK` / `UNCHECK` pour Completion. Vocabulaire propre à chaque entityType |
| `user` | FK User nullable | Auteur de l'action. `onDelete: SET NULL` pour respect GDPR |
| `poste` / `mission` | FK nullable | Contexte fort utilisé en analytics. `SET NULL` si supprimés plus tard |
| `payload` | JSON | Snapshot dénormalisé — voir §4 |
| `occurredAt` | datetime_immutable | Horodatage serveur — jamais modifiable |

**Pas de `createdAt`/`updatedAt`** : append-only, donc `occurredAt` suffit.
**Pas de `Patch` ni `Delete`** dans les operations API Platform : la table n'est jamais modifiée après écriture.

---

## 4. Payload — snapshot dénormalisé

L'objectif : qu'un export 2 ans plus tard reste lisible même si la mission, la zone, l'utilisateur ont été renommés/supprimés.

Pour `entityType = 'completion'`, on stocke a minima :

```json
{
  "missionNom": "Vider la corbeille du Bar",
  "missionPriorite": "important",
  "zoneNom": "Bar",
  "zoneCouleur": "#a855f7",
  "userNom": "Sophie L.",
  "serviceId": 142,
  "serviceDate": "2026-05-30",
  "serviceCreneau": "soir"
}
```

> Voluntairement **petit** : 8 clés max. On ne dénormalise pas l'intégralité des entités —
> on garde ce qui est nécessaire à l'affichage timeline + analytics sans rejoindre la BDD.

---

## 5. Listener Doctrine — `CompletionEventLogger`

Le listener est **le seul écrivain** d'EventLog pour Completion. Aucun appel manuel depuis les controllers.

```php
namespace App\EventListener;

use App\Entity\Completion;
use App\Entity\EventLog;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::preRemove)]
final class CompletionEventLogger
{
    public function __construct(private readonly Security $security) {}

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Completion) return;

        $this->log($args, $entity, EventLog::ACTION_CHECK);
    }

    public function preRemove(PreRemoveEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Completion) return;

        $this->log($args, $entity, EventLog::ACTION_UNCHECK);
    }

    private function log(/* … */ $args, Completion $c, string $action): void
    {
        $em      = $args->getObjectManager();
        $poste   = $c->getPoste();
        $mission = $c->getMission();
        $service = $poste?->getService();
        $author  = $this->security->getUser() ?? $c->getUser();

        $event = (new EventLog())
            ->setCentre($poste?->getZone()?->getCentre()) // résolu via Zone
            ->setEntityType(EventLog::ENTITY_COMPLETION)
            ->setEntityId($c->getId())
            ->setAction($action)
            ->setUser($author)
            ->setPoste($poste)
            ->setMission($mission)
            ->setPayload([
                'missionNom'      => $mission?->getNom(),
                'missionPriorite' => $mission?->getPriorite(),
                'zoneNom'         => $poste?->getZone()?->getNom(),
                'zoneCouleur'     => $poste?->getZone()?->getCouleur(),
                'userNom'         => $author?->getNom(),
                'serviceId'       => $service?->getId(),
                'serviceDate'     => $service?->getDate()?->format('Y-m-d'),
                'serviceCreneau'  => $service?->getCreneau(),
            ]);

        $em->persist($event);
        // pas de flush ici — le flush courant le poussera
    }
}
```

> **Attention** : le service `Security` n'est pas dispo en CLI (fixtures). Le listener
> doit gérer le cas `getUser() === null` en retombant sur `Completion::getUser()`
> (déjà fait ci-dessus). En CLI sans aucun user → on log `user = null` et payload `userNom = null` (ok pour fixtures).

---

## 6. Multi-tenancy & sécurité

**Voter `EventLogVoter`** (lecture seule) :

```php
public const VIEW = 'VIEW';

protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
{
    if ($attribute !== self::VIEW || !$subject instanceof EventLog) return false;
    $user = $token->getUser();
    if (!$user instanceof User) return false;

    // Cloison stricte : un manager ne voit QUE les events de son centre
    return $subject->getCentre()?->getId() === $user->getCentre()?->getId();
}
```

**Provider API Platform** : pour `GetCollection`, filtrer automatiquement sur `centre = currentUser.centre` via un `CollectionExtensionInterface` (réutiliser le pattern déjà en place pour Completion).

**Pas d'accès EMPLOYE** : `security: "is_granted('ROLE_MANAGER')"` sur toutes les operations. Un employé n'a aucune raison de lire le journal.

---

## 7. Endpoints API

| Méthode | Route | Description | Sécurité |
|---|---|---|---|
| `GET` | `/api/event_logs` | Liste paginée (filtres `entityType`, `action`, `user`, `poste`, `mission`, `occurredAt[after]`, `occurredAt[before]`) | MANAGER + filtre centre auto |
| `GET` | `/api/event_logs/{id}` | Détail d'un event | MANAGER + Voter |
| `GET` | `/api/dashboard/completion-history` | Endpoint custom agrégé pour le widget /dashboard | MANAGER |

**Endpoint custom** — `DashboardController::completionHistory()` :

```
GET /api/dashboard/completion-history?from=2026-05-01&to=2026-05-30
→ {
    "periode": { "from": "2026-05-01", "to": "2026-05-30" },
    "totalChecks": 1842,
    "totalUnchecks": 47,
    "tauxCompletionParZone": [
      { "zone": "Bar",     "couleur": "#a855f7", "taux": 92.4 },
      { "zone": "Salle",   "couleur": "#22c55e", "taux": 88.1 },
      { "zone": "Accueil", "couleur": "#3b82f6", "taux": 95.6 }
    ],
    "missionsLesPlusOubliees": [
      { "missionId": 12, "missionNom": "Vider corbeille bar", "fois": 14 }
    ],
    "rankingStaff": [
      { "userId": 7, "userNom": "Sophie L.", "checks": 312, "tauxPersonnel": 96.2 }
    ]
  }
```

Cache HTTP léger : `Cache-Control: private, max-age=60` (les events sont append-only, donc une fenêtre de 60s sur une période passée est acceptable).

---

## 8. Requêtes analytics — exemples DQL

**a. Taux complétion moyen par zone sur 30 jours (pour un centre) :**

```sql
SELECT
  JSON_UNQUOTE(JSON_EXTRACT(el.payload, '$.zoneNom'))     AS zone_nom,
  JSON_UNQUOTE(JSON_EXTRACT(el.payload, '$.zoneCouleur')) AS zone_couleur,
  SUM(CASE WHEN el.action = 'CHECK'   THEN 1 ELSE 0 END) AS nb_checks,
  SUM(CASE WHEN el.action = 'UNCHECK' THEN 1 ELSE 0 END) AS nb_unchecks
FROM event_log el
WHERE el.centre_id = :centreId
  AND el.entity_type = 'completion'
  AND el.occurred_at >= :from
GROUP BY zone_nom, zone_couleur
ORDER BY nb_checks DESC;
```

> `JSON_EXTRACT` est dispo en MySQL 5.7+ et PostgreSQL 12+ (`payload->>'zoneNom'` côté PG).
> Wrap le SQL dans un `NativeQuery` Doctrine OU expose un Repository custom par dialecte
> si tu veux rester portable (cf. règle absolue #15 — pas de migration SQLite committée).

**b. Top 5 missions oubliées (jamais cochées sur un service donné) :**

```sql
-- Toutes les missions attendues sur ce service / cette zone
-- moins celles qui ont au moins un CHECK postérieur au dernier UNCHECK
-- → côté PHP, plus lisible et testable
```

À implémenter dans `EventLogRepository::findMissionsOubliees(int $serviceId): array`.

**c. Timeline brute d'un service (drill-down) :**

```dql
SELECT el FROM App\Entity\EventLog el
WHERE el.centre = :centre
  AND el.entityType = 'completion'
  AND JSON_UNQUOTE(JSON_EXTRACT(el.payload, '$.serviceId')) = :serviceId
ORDER BY el.occurredAt ASC
```

---

## 9. UI — bloc "Historique des services" sur /dashboard

Position : sous le bloc "Service du jour" sur `/dashboard`. Visible **manager uniquement**.

**Sélecteur de période** (toggle pill) : `7 jours` · `30 jours` · `90 jours`
**3 widgets juxtaposés (desktop) / stack (mobile) :**

1. **Taux complétion par zone** — donut (Recharts) coloré aux couleurs des zones
2. **Top 5 missions oubliées** — liste avec compteur "X fois non cochée"
3. **Ranking staff** — top 5 employés avec taux personnel + avatar gradient

**Drill-down :** clic sur un service récent → modale `ServiceHistoryModal` :
- Timeline verticale `CHECK` / `UNCHECK` par minute
- Filtre par zone (toggle pills)
- Avatar + nom à chaque ligne

Loading skeleton, error state, empty state (`<EmptyState title="Pas encore d'historique" />` si `totalChecks === 0`).

Maquette HTML détaillée : `docs/maquettes/dashboard-history.html`.

---

## 10. Migration & déploiement

1. **Migration Doctrine** : nouvelle table `event_log` + 3 index composés
   - Vérifier compatibilité MySQL **ET** PostgreSQL avant push (règle absolue #15)
   - Pas de FK `ON DELETE CASCADE` pour `poste_id` / `mission_id` / `user_id` → `SET NULL` (préserver l'historique)
2. **Pas de backfill** des Completions existantes en events historiques (décision actée §1)
3. **Déploiement Railway** : à pousser après vérif Doctrine en environnement MySQL local
4. **Monitoring** : ajouter `SELECT COUNT(*) FROM event_log WHERE occurred_at >= NOW() - INTERVAL 1 DAY` au SuperAdmin pour vérifier l'écriture quotidienne

---

## 11. GDPR & rétention

- **Anonymisation user** : suppression d'un User → `user_id` passe à `NULL` via `onDelete: SET NULL`. Le `payload.userNom` reste lisible (obligation HACCP de tracer "qui a fait quoi").
- **Rétention** : 3 ans par défaut (alignement HACCP / Code du travail). Job cron mensuel `DELETE FROM event_log WHERE occurred_at < NOW() - INTERVAL 3 YEAR` — à mettre en place en Phase 2.
- **Droit à l'oubli RGPD** : si demande formelle, on peut UPDATE le payload pour pseudonymiser le `userNom` sans casser la chaîne audit (à documenter dans la procédure DPO de Shiftly).

---

## 12. Hors scope (Phase 2)

- Export PDF/CSV depuis l'UI manager
- Vue SuperAdmin avec filtre cross-centre
- Instrumentation HACCP (`entityType = 'haccp_check'`) — chantier dédié
- Instrumentation Pointage (`entityType = 'pointage_event'`)
- Webhook sortant vers outils externes (Slack, n8n) sur certains events
- Replay d'un service à un instant T

---

## 13. Critères d'acceptation

- [ ] Table `event_log` créée avec les 3 index composés
- [ ] Listener `CompletionEventLogger` écrit un event à chaque `POST /api/completions` et `DELETE /api/completions/{id}`
- [ ] L'event contient un `payload` non vide avec les 8 clés snapshot
- [ ] Aucune ressource API Platform n'expose `POST` / `PATCH` / `DELETE` sur `event_log`
- [ ] Un employé reçoit un `403` sur `GET /api/event_logs`
- [ ] Un manager du centre A ne voit aucun event du centre B (test multi-tenant)
- [ ] Endpoint `GET /api/dashboard/completion-history?from=…&to=…` renvoie le JSON spécifié §7
- [ ] Bloc "Historique des services" affiche les 3 widgets sur /dashboard avec loading/error/empty states
- [ ] Modale drill-down accessible au clic sur un service récent
- [ ] Migration testée sur MySQL **et** PostgreSQL avant push Railway
- [ ] `ARCHITECTURE.md`, `ENTITES.md`, `schema.sql` mis à jour dans le même commit

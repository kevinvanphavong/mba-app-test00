<?php

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
 *
 * - Aucun POST / PATCH / DELETE exposé : l'écriture est faite par les listeners.
 * - Lecture seule via API Platform, filtrée multi-tenant par CentreQueryExtension
 *   + EventLogVoter (cloison stricte par centre).
 *
 * Premier producteur : CompletionEventLogger (CHECK / UNCHECK des Completions).
 * Conçu pour être réutilisé par HACCP / Pointage / Incident en Phase 2.
 */
#[ORM\Entity(repositoryClass: EventLogRepository::class)]
#[ORM\Table(name: 'event_log')]
#[ORM\Index(columns: ['centre_id', 'entity_type', 'occurred_at'], name: 'idx_eventlog_centre_type_date')]
#[ORM\Index(columns: ['centre_id', 'user_id', 'occurred_at'],     name: 'idx_eventlog_centre_user_date')]
#[ORM\Index(columns: ['poste_id'],                                 name: 'idx_eventlog_poste')]
#[ORM\Index(columns: ['mission_id'],                               name: 'idx_eventlog_mission')]
#[ORM\Index(columns: ['user_id'],                                  name: 'idx_eventlog_user')]
#[ApiResource(
    normalizationContext: ['groups' => ['eventlog:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'centre'     => 'exact',
    'entityType' => 'exact',
    'action'     => 'exact',
    'user'       => 'exact',
    'poste'      => 'exact',
    'mission'    => 'exact',
])]
#[ApiFilter(DateFilter::class, properties: ['occurredAt'])]
class EventLog
{
    public const ENTITY_COMPLETION = 'completion';
    public const ACTION_CHECK      = 'CHECK';
    public const ACTION_UNCHECK    = 'UNCHECK';

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

    /** Id de l'objet d'origine (nullable car peut avoir été supprimé). */
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
     * Snapshot dénormalisé (8 clés max pour Completion — cf. EVENTLOG_MODULE.md §4).
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

    public function getId(): ?string { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }

    public function getEntityType(): string { return $this->entityType; }
    public function setEntityType(string $t): static { $this->entityType = $t; return $this; }

    public function getEntityId(): ?int { return $this->entityId; }
    public function setEntityId(?int $id): static { $this->entityId = $id; return $this; }

    public function getAction(): string { return $this->action; }
    public function setAction(string $a): static { $this->action = $a; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }

    public function getPoste(): ?Poste { return $this->poste; }
    public function setPoste(?Poste $p): static { $this->poste = $p; return $this; }

    public function getMission(): ?Mission { return $this->mission; }
    public function setMission(?Mission $m): static { $this->mission = $m; return $this; }

    public function getPayload(): array { return $this->payload; }
    public function setPayload(array $payload): static { $this->payload = $payload; return $this; }

    public function getOccurredAt(): \DateTimeImmutable { return $this->occurredAt; }
}

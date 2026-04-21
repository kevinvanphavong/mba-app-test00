<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\ServiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
#[ORM\Table(name: 'service')]
#[ORM\UniqueConstraint(name: 'uniq_service_centre_date', columns: ['centre_id', 'date'])]
#[UniqueEntity(
    fields:  ['centre', 'date'],
    message: 'Un service existe déjà pour cette date.'
)]
#[ApiResource(
    normalizationContext:   ['groups' => ['service:read']],
    denormalizationContext: ['groups' => ['service:write']],
    operations: [
        new GetCollection(
            security:    "is_granted('ROLE_USER')",
            description: 'Liste des services. Filtrer par ?centre=/api/centres/{id}'
        ),
        new Get(
            security:             "is_granted('ROLE_USER')",
            normalizationContext: ['groups' => ['service:read', 'service:item:read']]
        ),
        new Post(
            security:                "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Put(
            security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"
        ),
        new Patch(
            description: 'Mise à jour partielle (note, statut…)',
            security:    "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['statut' => 'exact', 'centre' => 'exact'])]
#[ApiFilter(DateFilter::class,   properties: ['date'])]
#[ApiFilter(OrderFilter::class,  properties: ['date', 'statut'])]
class Service
{
    const STATUT_PLANIFIE = 'PLANIFIE';
    const STATUT_EN_COURS = 'EN_COURS';
    const STATUT_TERMINE  = 'TERMINE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['service:read', 'poste:read', 'incident:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['service:read', 'service:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(type: 'date_immutable')]
    #[Assert\NotNull]
    #[Groups(['service:read', 'service:write'])]
    private ?\DateTimeImmutable $date = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    private ?\DateTimeImmutable $heureDebut = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    private ?\DateTimeImmutable $heureFin = null;

    #[ORM\Column(length: 20)]
    #[Groups(['service:read', 'service:write'])]
    private string $statut = self::STATUT_PLANIFIE;

    #[ORM\Column(type: 'float', options: ['default' => 0])]
    #[Groups(['service:read', 'service:write'])]
    private float $tauxCompletion = 0.0;

    /** Note libre laissée par le manager pour passer des informations aux collègues */
    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['service:read', 'service:write'])]
    private ?string $note = null;

    /** Snapshot JSON de toutes les missions au moment de la clôture du service */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $missionsSnapshot = null;

    /** Postes du jour — exposés uniquement dans l'item */
    #[ORM\OneToMany(mappedBy: 'service', targetEntity: Poste::class, cascade: ['remove'])]
    #[Groups(['service:item:read'])]
    private Collection $postes;

    #[ORM\OneToMany(mappedBy: 'service', targetEntity: Incident::class)]
    private Collection $incidents;

    /** Managers responsables de ce service */
    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'service_manager')]
    private Collection $managers;

    public function __construct()
    {
        $this->postes    = new ArrayCollection();
        $this->incidents = new ArrayCollection();
        $this->managers  = new ArrayCollection();
    }

    public function getManagers(): Collection { return $this->managers; }
    public function addManager(User $user): static { if (!$this->managers->contains($user)) { $this->managers->add($user); } return $this; }
    public function removeManager(User $user): static { $this->managers->removeElement($user); return $this; }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }
    public function getDate(): ?\DateTimeImmutable { return $this->date; }
    public function setDate(?\DateTimeImmutable $d): static { $this->date = $d; return $this; }
    public function getHeureDebut(): ?\DateTimeImmutable { return $this->heureDebut; }
    public function setHeureDebut(?\DateTimeImmutable $v): static { $this->heureDebut = $v; return $this; }
    public function getHeureFin(): ?\DateTimeImmutable { return $this->heureFin; }
    public function setHeureFin(?\DateTimeImmutable $v): static { $this->heureFin = $v; return $this; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getTauxCompletion(): float { return $this->tauxCompletion; }
    public function setTauxCompletion(float $v): static { $this->tauxCompletion = $v; return $this; }
    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $note): static { $this->note = $note; return $this; }
    public function getMissionsSnapshot(): ?array { return $this->missionsSnapshot; }
    public function setMissionsSnapshot(?array $v): static { $this->missionsSnapshot = $v; return $this; }
    public function getPostes(): Collection { return $this->postes; }
    public function getIncidents(): Collection { return $this->incidents; }
}

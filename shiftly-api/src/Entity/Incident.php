<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\IncidentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * POST /api/incidents  → signaler (tout employé)
 * PUT  /api/incidents/{id} → résoudre / changer statut (MANAGER ou auteur)
 */
#[ORM\Entity(repositoryClass: IncidentRepository::class)]
#[ApiResource(
    normalizationContext:   ['groups' => ['incident:read']],
    denormalizationContext: ['groups' => ['incident:write']],
    operations: [
        new GetCollection(
            security:    "is_granted('ROLE_USER')",
            description: "Incidents d'un centre. ?centre=&statut=&severite="
        ),
        new Get(
            security: "is_granted('ROLE_USER') and is_granted('VIEW', object)"
        ),
        new Post(
            description: 'Signaler un incident (tout membre du centre)',
            security:    "is_granted('ROLE_USER')"
        ),
        new Put(
            description: 'Mettre à jour un incident (MANAGER ou auteur)',
            security:    "is_granted('EDIT', object) and (is_granted('ROLE_MANAGER') or object.getUser() == user)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'statut'   => 'exact',     // ?statut=OUVERT
    'severite' => 'exact',     // ?severite=haute
    'centre'   => 'exact',
    'service'  => 'exact',
    'titre'    => 'partial',
])]
#[ApiFilter(DateFilter::class,  properties: ['createdAt'])]
#[ApiFilter(OrderFilter::class, properties: ['createdAt', 'severite', 'statut'])]
class Incident
{
    const SEV_HAUTE   = 'haute';
    const SEV_MOYENNE = 'moyenne';
    const SEV_BASSE   = 'basse';

    const STATUT_OUVERT   = 'OUVERT';
    const STATUT_EN_COURS = 'EN_COURS';
    const STATUT_RESOLU   = 'RESOLU';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['incident:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['incident:read', 'incident:write'])]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: 'incidents')]
    #[Groups(['incident:read', 'incident:write'])]
    private ?Service $service = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['incident:read', 'incident:write'])]
    private ?string $titre = null;

    #[ORM\Column(length: 20)]
    #[Groups(['incident:read', 'incident:write'])]
    private string $severite = self::SEV_BASSE;

    #[ORM\Column(length: 20)]
    #[Groups(['incident:read', 'incident:write'])]
    private string $statut = self::STATUT_OUVERT;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['incident:read', 'incident:write'])]
    private ?User $user = null;

    #[ORM\Column]
    #[Groups(['incident:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['incident:read'])]
    private ?\DateTimeImmutable $resolvedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }
    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $s): static { $this->service = $s; return $this; }
    public function getTitre(): ?string { return $this->titre; }
    public function setTitre(string $titre): static { $this->titre = $titre; return $this; }
    public function getSeverite(): string { return $this->severite; }
    public function setSeverite(string $s): static { $this->severite = $s; return $this; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $s): static
    {
        $this->statut = $s;
        if ($s === self::STATUT_RESOLU && $this->resolvedAt === null) {
            $this->resolvedAt = new \DateTimeImmutable();
        }
        return $this;
    }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getResolvedAt(): ?\DateTimeImmutable { return $this->resolvedAt; }
}

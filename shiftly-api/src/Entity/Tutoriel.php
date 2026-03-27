<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\TutorielRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * GET /api/tutoriels?centre=&zone=&niveau=   → tout employé
 * POST/PUT/DELETE → MANAGER uniquement
 */
#[ORM\Entity(repositoryClass: TutorielRepository::class)]
#[ApiResource(
    normalizationContext:   ['groups' => ['tutoriel:read']],
    denormalizationContext: ['groups' => ['tutoriel:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(
            security:             "is_granted('ROLE_USER') and is_granted('VIEW', object)",
            normalizationContext: ['groups' => ['tutoriel:read', 'tutoriel:item:read']]
        ),
        new Post(
            security:                "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Put(
            security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'titre'  => 'partial',   // ?titre=accueil
    'zone'   => 'partial',   // ?zone=bar
    'niveau' => 'exact',     // ?niveau=debutant
    'centre' => 'exact',     // ?centre=/api/centres/1
])]
#[ApiFilter(DateFilter::class,  properties: ['createdAt'])]
#[ApiFilter(OrderFilter::class, properties: ['createdAt', 'niveau', 'dureMin'])]
class Tutoriel
{
    const NIVEAU_DEBUTANT      = 'debutant';
    const NIVEAU_INTERMEDIAIRE = 'intermediaire';
    const NIVEAU_AVANCE        = 'avance';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['tutoriel:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 200)]
    #[Assert\NotBlank]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private ?string $titre = null;

    /** Nom de la zone cible (Accueil / Bar / Salle / null = général) */
    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private ?string $zone = null;

    #[ORM\Column(length: 20)]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private string $niveau = self::NIVEAU_DEBUTANT;

    #[ORM\Column(nullable: true)]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private ?int $dureMin = null;

    /**
     * Contenu structuré : array de blocs
     * [{ "type": "intro"|"step"|"tip", "text": "...", "number": 1, "title": "..." }]
     */
    #[ORM\Column(type: 'json')]
    #[Groups(['tutoriel:read', 'tutoriel:write'])]
    private array $contenu = [];

    #[ORM\Column]
    #[Groups(['tutoriel:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'tutoriel', targetEntity: TutoRead::class, cascade: ['remove'])]
    private Collection $lectures;

    public function __construct()
    {
        $this->lectures  = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }
    public function getTitre(): ?string { return $this->titre; }
    public function setTitre(string $titre): static { $this->titre = $titre; return $this; }
    public function getZone(): ?string { return $this->zone; }
    public function setZone(?string $zone): static { $this->zone = $zone; return $this; }
    public function getNiveau(): string { return $this->niveau; }
    public function setNiveau(string $niveau): static { $this->niveau = $niveau; return $this; }
    public function getDureMin(): ?int { return $this->dureMin; }
    public function setDureMin(?int $dureMin): static { $this->dureMin = $dureMin; return $this; }
    public function getContenu(): array { return $this->contenu; }
    public function setContenu(array $contenu): static { $this->contenu = $contenu; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getLectures(): Collection { return $this->lectures; }
}

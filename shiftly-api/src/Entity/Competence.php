<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\CompetenceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Référentiel de compétences par zone.
 * Tout employé peut lire, seul MANAGER peut écrire.
 */
#[ORM\Entity(repositoryClass: CompetenceRepository::class)]
#[ApiResource(
    normalizationContext:   ['groups' => ['competence:read']],
    denormalizationContext: ['groups' => ['competence:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER')"),
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
    'nom'        => 'partial',   // ?nom=caisse
    'difficulte' => 'exact',     // ?difficulte=avancee
    'zone'       => 'exact',     // ?zone=/api/zones/1
])]
#[ApiFilter(OrderFilter::class, properties: ['points', 'difficulte', 'nom'])]
class Competence
{
    const DIFF_SIMPLE      = 'simple';
    const DIFF_AVANCEE     = 'avancee';
    const DIFF_EXPERIMENTE = 'experimente';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['competence:read', 'staffcompetence:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Zone::class, inversedBy: 'competences')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['competence:read', 'competence:write', 'staffcompetence:read'])]
    private ?Zone $zone = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Groups(['competence:read', 'competence:write', 'staffcompetence:read'])]
    private ?string $nom = null;

    #[ORM\Column]
    #[Groups(['competence:read', 'competence:write', 'staffcompetence:read'])]
    private int $points = 10;

    #[ORM\Column(length: 30)]
    #[Groups(['competence:read', 'competence:write', 'staffcompetence:read'])]
    private string $difficulte = self::DIFF_SIMPLE;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['competence:read', 'competence:write'])]
    private ?string $description = null;

    #[ORM\OneToMany(mappedBy: 'competence', targetEntity: StaffCompetence::class, cascade: ['remove'])]
    private Collection $staffCompetences;

    public function __construct()
    {
        $this->staffCompetences = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getZone(): ?Zone { return $this->zone; }
    public function setZone(?Zone $zone): static { $this->zone = $zone; return $this; }
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getPoints(): int { return $this->points; }
    public function setPoints(int $points): static { $this->points = $points; return $this; }
    public function getDifficulte(): string { return $this->difficulte; }
    public function setDifficulte(string $difficulte): static { $this->difficulte = $difficulte; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }
    public function getStaffCompetences(): Collection { return $this->staffCompetences; }
}

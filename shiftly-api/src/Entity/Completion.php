<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\CompletionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Cocher une mission dans un Poste.
 *
 * POST /api/completions { "poste": "/api/postes/1", "mission": "/api/missions/5" }
 * DELETE /api/completions/{id}  → décocher
 */
#[ORM\Entity(repositoryClass: CompletionRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_completion', columns: ['poste_id', 'mission_id'])]
#[ApiResource(
    normalizationContext:   ['groups' => ['completion:read']],
    denormalizationContext: ['groups' => ['completion:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(
            security: "is_granted('ROLE_USER') and is_granted('VIEW', object)"
        ),
        new Post(
            description: 'Cocher une mission (tout employé affecté)',
            security:    "is_granted('ROLE_USER')"
        ),
        new Delete(
            description: 'Décocher une mission',
            security:    "is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'poste'   => 'exact',    // ?poste=/api/postes/1
    'mission' => 'exact',    // ?mission=/api/missions/3
    'user'    => 'exact',
])]
#[ApiFilter(DateFilter::class, properties: ['completedAt'])]
class Completion
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['completion:read', 'poste:item:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Poste::class, inversedBy: 'completions')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['completion:read', 'completion:write'])]
    private ?Poste $poste = null;

    #[ORM\ManyToOne(targetEntity: Mission::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['completion:read', 'completion:write'])]
    private ?Mission $mission = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[Groups(['completion:read', 'completion:write'])]
    private ?User $user = null;

    #[ORM\Column]
    #[Groups(['completion:read'])]
    private ?\DateTimeImmutable $completedAt = null;

    public function __construct()
    {
        $this->completedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getPoste(): ?Poste { return $this->poste; }
    public function setPoste(?Poste $p): static { $this->poste = $p; return $this; }
    public function getMission(): ?Mission { return $this->mission; }
    public function setMission(?Mission $m): static { $this->mission = $m; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }
    public function getCompletedAt(): ?\DateTimeImmutable { return $this->completedAt; }
    public function setCompletedAt(\DateTimeImmutable $dt): static { $this->completedAt = $dt; return $this; }
}

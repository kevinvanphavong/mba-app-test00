<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\PosteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Affectation d'un User à une Zone pour un Service donné.
 *
 * GET  /api/postes?service=/api/services/{id}  → postes d'un service
 * GET  /api/postes?user=/api/users/{id}         → postes d'un membre
 * POST /api/postes                              → affecter (MANAGER)
 */
#[ORM\Entity(repositoryClass: PosteRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_poste', columns: ['service_id', 'zone_id', 'user_id'])]
#[ApiResource(
    normalizationContext:   ['groups' => ['poste:read']],
    denormalizationContext: ['groups' => ['poste:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(
            security:             "is_granted('ROLE_USER') and is_granted('VIEW', object)",
            normalizationContext: ['groups' => ['poste:read', 'poste:item:read']]
        ),
        new Post(
            security:                "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'service' => 'exact',   // ?service=/api/services/2
    'zone'    => 'exact',   // ?zone=/api/zones/1
    'user'    => 'exact',   // ?user=/api/users/3
])]
class Poste
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['poste:read', 'completion:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: 'postes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['poste:read', 'poste:write'])]
    private ?Service $service = null;

    #[ORM\ManyToOne(targetEntity: Zone::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['poste:read', 'poste:write'])]
    private ?Zone $zone = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['poste:read', 'poste:write'])]
    private ?User $user = null;

    /** Completions — dans l'item seulement */
    #[ORM\OneToMany(mappedBy: 'poste', targetEntity: Completion::class, cascade: ['remove'])]
    #[Groups(['poste:item:read'])]
    private Collection $completions;

    public function __construct()
    {
        $this->completions = new ArrayCollection();
    }

    public function tauxCompletion(int $totalMissions): float
    {
        if ($totalMissions === 0) return 0.0;
        return round($this->completions->count() / $totalMissions * 100, 1);
    }

    public function getId(): ?int { return $this->id; }
    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $s): static { $this->service = $s; return $this; }
    public function getZone(): ?Zone { return $this->zone; }
    public function setZone(?Zone $z): static { $this->zone = $z; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }
    public function getCompletions(): Collection { return $this->completions; }
}

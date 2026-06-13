<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\PosteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Affectation d'un User à une Zone pour un Service donné.
 *
 * GET  /api/postes?service=/api/services/{id}  → postes d'un service
 * GET  /api/postes?user=/api/users/{id}         → postes d'un membre
 * POST /api/postes                              → affecter (MANAGER)
 */
#[ORM\Entity(repositoryClass: PosteRepository::class)]
// Créneaux multiples d'une même personne dans une même zone autorisés tant que
// l'horaire diffère. heure_debut dans l'index + NULLS NOT DISTINCT (cf. migration)
// pour bloquer aussi le doublon "sans horaire" (Service du jour). Cf. ServiceDuJour.
#[ORM\UniqueConstraint(name: 'uniq_poste', columns: ['service_id', 'zone_id', 'user_id', 'heure_debut'])]
#[ApiResource(
    normalizationContext: ['groups' => ['poste:read']],
    denormalizationContext: ['groups' => ['poste:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(
            security: "is_granted('ROLE_USER') and is_granted('VIEW', object)",
            normalizationContext: ['groups' => ['poste:read', 'poste:item:read']]
        ),
        new Post(
            security: "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
        new Patch(
            security: "is_granted('ROLE_MANAGER')",
            denormalizationContext: ['groups' => ['poste:write']]
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'service' => 'exact',   // ?service=/api/services/2
    'zone' => 'exact',   // ?zone=/api/zones/1
    'user' => 'exact',   // ?user=/api/users/3
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

    /** Heure de début du shift (null si non planifié) */
    #[ORM\Column(type: 'time_immutable', nullable: true)]
    #[Groups(['poste:read', 'poste:write'])]
    private ?\DateTimeImmutable $heureDebut = null;

    /** Heure de fin du shift (null si non planifié) */
    #[ORM\Column(type: 'time_immutable', nullable: true)]
    #[Groups(['poste:read', 'poste:write'])]
    private ?\DateTimeImmutable $heureFin = null;

    /** Durée de pause en minutes */
    #[ORM\Column(options: ['default' => 0])]
    #[Groups(['poste:read', 'poste:write'])]
    #[Assert\GreaterThanOrEqual(value: 0, message: 'La pause ne peut pas être négative.')]
    #[Assert\LessThanOrEqual(value: 1440, message: 'La pause ne peut pas dépasser 24h.')]
    private int $pauseMinutes = 0;

    /** Note libre manager (visible staff) */
    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    #[Groups(['poste:read', 'poste:write'])]
    #[Assert\Length(max: 500, maxMessage: 'La note ne peut pas dépasser {{ limit }} caractères.')]
    private ?string $note = null;

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
        if (0 === $totalMissions) {
            return 0.0;
        }

        return round($this->completions->count() / $totalMissions * 100, 1);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getService(): ?Service
    {
        return $this->service;
    }

    public function setService(?Service $s): static
    {
        $this->service = $s;

        return $this;
    }

    public function getZone(): ?Zone
    {
        return $this->zone;
    }

    public function setZone(?Zone $z): static
    {
        $this->zone = $z;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $u): static
    {
        $this->user = $u;

        return $this;
    }

    public function getHeureDebut(): ?\DateTimeImmutable
    {
        return $this->heureDebut;
    }

    public function setHeureDebut(?\DateTimeImmutable $h): static
    {
        $this->heureDebut = $h;

        return $this;
    }

    public function getHeureFin(): ?\DateTimeImmutable
    {
        return $this->heureFin;
    }

    public function setHeureFin(?\DateTimeImmutable $h): static
    {
        $this->heureFin = $h;

        return $this;
    }

    public function getPauseMinutes(): int
    {
        return $this->pauseMinutes;
    }

    public function setPauseMinutes(int $p): static
    {
        $this->pauseMinutes = $p;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $n): static
    {
        $this->note = $n;

        return $this;
    }

    public function getCompletions(): Collection
    {
        return $this->completions;
    }
}

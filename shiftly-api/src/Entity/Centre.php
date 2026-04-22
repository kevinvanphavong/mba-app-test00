<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\CentreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CentreRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity('slug')]
#[ApiResource(
    normalizationContext:   ['groups' => ['centre:read']],
    denormalizationContext: ['groups' => ['centre:write']],
    operations: [
        new GetCollection(
            security: "is_granted('ROLE_USER')"
        ),
        new Get(
            security: "is_granted('ROLE_USER')"
        ),
        new Post(
            security: "is_granted('ROLE_MANAGER')"
        ),
        new Put(
            security: "is_granted('ROLE_MANAGER')"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['nom' => 'partial', 'slug' => 'exact'])]
#[ApiFilter(OrderFilter::class,  properties: ['nom', 'createdAt'])]
class Centre
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['centre:read', 'user:read', 'service:read', 'zone:read',
              'incident:read', 'tutoriel:read', 'poste:read', 'staffcompetence:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['centre:read', 'centre:write', 'user:read', 'service:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 120, unique: true)]
    #[Groups(['centre:read', 'centre:write'])]
    private ?string $slug = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['centre:read', 'centre:write'])]
    private ?string $adresse = null;

    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['centre:read', 'centre:write'])]
    private ?string $telephone = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['centre:read', 'centre:write'])]
    private ?string $siteWeb = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['centre:read', 'centre:write'])]
    private ?array $openingHours = null;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['centre:read'])]
    private bool $actif = true;

    #[ORM\Column]
    #[Groups(['centre:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'centre', targetEntity: User::class)]
    private Collection $users;

    #[ORM\OneToMany(mappedBy: 'centre', targetEntity: Zone::class)]
    private Collection $zones;

    public function __construct()
    {
        $this->users     = new ArrayCollection();
        $this->zones     = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function generateSlug(): void
    {
        if ($this->nom !== null && ($this->slug === null || $this->slug === '')) {
            $slug = mb_strtolower($this->nom);
            $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? $slug;
            $this->slug = trim($slug, '-');
        }
    }

    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }
    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }
    public function getSiteWeb(): ?string { return $this->siteWeb; }
    public function setSiteWeb(?string $siteWeb): static { $this->siteWeb = $siteWeb; return $this; }
    public function getOpeningHours(): ?array { return $this->openingHours; }
    public function setOpeningHours(?array $openingHours): static { $this->openingHours = $openingHours; return $this; }

    public function getId(): ?int { return $this->id; }
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getSlug(): ?string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }
    public function isActif(): bool { return $this->actif; }
    public function setActif(bool $actif): static { $this->actif = $actif; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUsers(): Collection { return $this->users; }
    public function getZones(): Collection { return $this->zones; }
}

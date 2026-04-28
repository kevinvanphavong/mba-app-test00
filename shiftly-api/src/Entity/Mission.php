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
use App\Repository\MissionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MissionRepository::class)]
#[ApiResource(
    normalizationContext:   ['groups' => ['mission:read']],
    denormalizationContext: ['groups' => ['mission:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER')"),
        new Post(security:          "is_granted('ROLE_MANAGER')"),
        new Put(security:           "is_granted('ROLE_MANAGER')"),
        new Delete(security:        "is_granted('ROLE_MANAGER')"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'texte'     => 'partial',
    'categorie' => 'exact',    // ?categorie=OUVERTURE
    'frequence' => 'exact',    // ?frequence=FIXE
    'priorite'  => 'exact',    // ?priorite=vitale
    'zone'      => 'exact',    // ?zone=/api/zones/1
])]
#[ApiFilter(OrderFilter::class, properties: ['ordre', 'categorie', 'priorite'])]
class Mission
{
    /** Catégorie — moment de la journée */
    const CAT_OUVERTURE = 'OUVERTURE';
    const CAT_PENDANT   = 'PENDANT';
    const CAT_MENAGE    = 'MENAGE';
    const CAT_FERMETURE = 'FERMETURE';

    /** Fréquence — récurrente ou ponctuelle */
    const FREQ_FIXE       = 'FIXE';
    const FREQ_PONCTUELLE = 'PONCTUELLE';

    const PRIO_VITALE          = 'vitale';
    const PRIO_IMPORTANT       = 'important';
    const PRIO_NE_PAS_OUBLIER  = 'ne_pas_oublier';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['mission:read', 'completion:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Zone::class, inversedBy: 'missions')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['mission:read', 'mission:write', 'completion:read'])]
    private ?Zone $zone = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['mission:read', 'mission:write', 'completion:read'])]
    private ?string $texte = null;

    /** Catégorie : OUVERTURE | PENDANT | MENAGE | FERMETURE */
    #[ORM\Column(length: 30)]
    #[Groups(['mission:read', 'mission:write', 'completion:read'])]
    private string $categorie = self::CAT_PENDANT;

    /** Fréquence : FIXE (récurrente à chaque service) | PONCTUELLE (liée à un service) */
    #[ORM\Column(length: 20)]
    #[Groups(['mission:read', 'mission:write'])]
    private string $frequence = self::FREQ_FIXE;

    #[ORM\Column(length: 30)]
    #[Groups(['mission:read', 'mission:write', 'completion:read'])]
    private string $priorite = self::PRIO_NE_PAS_OUBLIER;

    #[ORM\Column]
    #[Groups(['mission:read', 'mission:write'])]
    private int $ordre = 0;

    /**
     * Service auquel la mission est rattachée (missions PONCTUELLES uniquement).
     * NULL pour les missions FIXES (elles appartiennent à la zone, pas à un service).
     */
    #[ORM\ManyToOne(targetEntity: Service::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['mission:read', 'mission:write'])]
    private ?Service $service = null;

    /**
     * true → la mission nécessite une preuve photo pour être validée.
     * Le front bascule alors sur le flow capture (input capture=environment)
     * au lieu du toggle direct.
     */
    #[ORM\Column(options: ['default' => false])]
    #[Groups(['mission:read', 'mission:write', 'completion:read'])]
    private bool $requiresPhoto = false;

    public function getId(): ?int { return $this->id; }

    public function getZone(): ?Zone { return $this->zone; }
    public function setZone(?Zone $zone): static { $this->zone = $zone; return $this; }

    public function getTexte(): ?string { return $this->texte; }
    public function setTexte(string $texte): static { $this->texte = $texte; return $this; }

    public function getCategorie(): string { return $this->categorie; }
    public function setCategorie(string $categorie): static { $this->categorie = $categorie; return $this; }

    public function getFrequence(): string { return $this->frequence; }
    public function setFrequence(string $frequence): static { $this->frequence = $frequence; return $this; }

    public function getPriorite(): string { return $this->priorite; }
    public function setPriorite(string $p): static { $this->priorite = $p; return $this; }

    public function getOrdre(): int { return $this->ordre; }
    public function setOrdre(int $ordre): static { $this->ordre = $ordre; return $this; }

    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $service): static { $this->service = $service; return $this; }

    public function getRequiresPhoto(): bool { return $this->requiresPhoto; }
    public function setRequiresPhoto(bool $r): static { $this->requiresPhoto = $r; return $this; }
}

<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\HaccpEquipementRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Équipement froid d'un centre (frigo, congélateur, vitrine).
 * Source de vérité des seuils T° — alimente le générateur de missions HACCP.
 *
 * Multi-tenant : `centre` direct (filtré par CentreQueryExtension).
 * Voter : VIEW (tout user du centre) / EDIT-CREATE-DELETE (MANAGER only).
 */
#[ORM\Entity(repositoryClass: HaccpEquipementRepository::class)]
#[ORM\Table(name: 'haccp_equipement')]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(columns: ['centre_id', 'actif'], name: 'idx_haccp_equip_centre')]
#[ORM\Index(columns: ['zone_id'],            name: 'idx_haccp_equip_zone')]
#[ApiResource(
    shortName: 'HaccpEquipement',
    normalizationContext:   ['groups' => ['haccp_equip:read']],
    denormalizationContext: ['groups' => ['haccp_equip:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER') and is_granted('VIEW', object)"),
        new Post(
            security:                "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
        new Delete(security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['centre' => 'exact', 'type' => 'exact', 'actif' => 'exact'])]
#[ApiFilter(OrderFilter::class,  properties: ['ordre', 'nom', 'createdAt'])]
class HaccpEquipement
{
    public const TYPE_FRIGO        = 'FRIGO';
    public const TYPE_CONGELATEUR  = 'CONGELATEUR';
    public const TYPE_VITRINE      = 'VITRINE';
    public const TYPE_AUTRE        = 'AUTRE';

    public const TYPES = [
        self::TYPE_FRIGO,
        self::TYPE_CONGELATEUR,
        self::TYPE_VITRINE,
        self::TYPE_AUTRE,
    ];

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['haccp_equip:read', 'mission:read', 'haccp_proof:read', 'haccp_registre:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['haccp_equip:read', 'haccp_equip:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['haccp_equip:read', 'haccp_equip:write', 'mission:read', 'haccp_registre:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: self::TYPES)]
    #[Groups(['haccp_equip:read', 'haccp_equip:write', 'mission:read', 'haccp_registre:read'])]
    private string $type = self::TYPE_FRIGO;

    #[ORM\ManyToOne(targetEntity: Zone::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['haccp_equip:read', 'haccp_equip:write'])]
    private ?Zone $zone = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2)]
    #[Groups(['haccp_equip:read', 'haccp_equip:write', 'mission:read', 'haccp_registre:read'])]
    private string $seuilMin = '0.00';

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2)]
    #[Groups(['haccp_equip:read', 'haccp_equip:write', 'mission:read', 'haccp_registre:read'])]
    private string $seuilMax = '4.00';

    #[ORM\Column(length: 10, options: ['default' => '°C'])]
    #[Groups(['haccp_equip:read', 'haccp_equip:write', 'mission:read', 'haccp_registre:read'])]
    private string $unite = '°C';

    #[ORM\Column(options: ['default' => 0])]
    #[Groups(['haccp_equip:read', 'haccp_equip:write'])]
    private int $ordre = 0;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['haccp_equip:read', 'haccp_equip:write'])]
    private bool $actif = true;

    #[ORM\Column]
    #[Groups(['haccp_equip:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['haccp_equip:read'])]
    private ?\DateTime $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'equipement', targetEntity: MissionHaccpSpec::class, cascade: ['remove'])]
    private Collection $haccpSpecs;

    public function __construct()
    {
        $this->haccpSpecs = new ArrayCollection();
        $this->createdAt  = new \DateTimeImmutable();
        $this->updatedAt  = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function touch(): void { $this->updatedAt = new \DateTime(); }

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(?string $n): static { $this->nom = $n; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $t): static { $this->type = $t; return $this; }

    public function getZone(): ?Zone { return $this->zone; }
    public function setZone(?Zone $z): static { $this->zone = $z; return $this; }

    public function getSeuilMin(): float { return (float) $this->seuilMin; }
    public function setSeuilMin(float $v): static { $this->seuilMin = number_format($v, 2, '.', ''); return $this; }

    public function getSeuilMax(): float { return (float) $this->seuilMax; }
    public function setSeuilMax(float $v): static { $this->seuilMax = number_format($v, 2, '.', ''); return $this; }

    public function getUnite(): string { return $this->unite; }
    public function setUnite(string $u): static { $this->unite = $u; return $this; }

    public function getOrdre(): int { return $this->ordre; }
    public function setOrdre(int $o): static { $this->ordre = $o; return $this; }

    public function isActif(): bool { return $this->actif; }
    public function setActif(bool $a): static { $this->actif = $a; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTime { return $this->updatedAt; }

    /** @return Collection<int, MissionHaccpSpec> */
    public function getHaccpSpecs(): Collection { return $this->haccpSpecs; }
}

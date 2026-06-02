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
use App\Repository\MissionHaccpSpecRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Extension HACCP optionnelle d'une Mission : type de relevé, équipement lié, seuils.
 *
 * Relation 1-1 avec Mission (ON DELETE CASCADE).
 * Le champ `archivee` permet au générateur d'archiver les missions T° d'un
 * équipement désactivé sans toucher à la table Mission (cf. CLAUDE.md
 * "0 modif structurelle sur Mission").
 */
#[ORM\Entity(repositoryClass: MissionHaccpSpecRepository::class)]
#[ORM\Table(name: 'mission_haccp_spec')]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'uniq_haccp_spec_mission', columns: ['mission_id'])]
#[ORM\Index(columns: ['centre_id'],     name: 'idx_haccp_spec_centre')]
#[ORM\Index(columns: ['equipement_id'], name: 'idx_haccp_spec_equipement')]
#[ApiResource(
    shortName: 'MissionHaccpSpec',
    normalizationContext:   ['groups' => ['haccp_spec:read']],
    denormalizationContext: ['groups' => ['haccp_spec:write']],
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
#[ApiFilter(SearchFilter::class, properties: [
    'centre'     => 'exact',
    'mission'    => 'exact',
    'equipement' => 'exact',
    'typeReleve' => 'exact',
])]
class MissionHaccpSpec
{
    public const TYPE_TEMPERATURE = 'TEMPERATURE';
    public const TYPE_DLC         = 'DLC';
    public const TYPE_PHOTO       = 'PHOTO';
    public const TYPE_RECEPTION   = 'RECEPTION';

    public const TYPES = [
        self::TYPE_TEMPERATURE,
        self::TYPE_DLC,
        self::TYPE_PHOTO,
        self::TYPE_RECEPTION,
    ];

    public const MOMENT_DEBUT_SERVICE = 'DEBUT_SERVICE';
    public const MOMENT_FIN_SERVICE   = 'FIN_SERVICE';

    public const MOMENTS = [
        self::MOMENT_DEBUT_SERVICE,
        self::MOMENT_FIN_SERVICE,
    ];

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['haccp_spec:read', 'mission:read', 'haccp_proof:read', 'haccp_registre:read'])]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'haccpSpec', targetEntity: Mission::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['haccp_spec:read', 'haccp_spec:write'])]
    private ?Mission $mission = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write'])]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: HaccpEquipement::class, inversedBy: 'haccpSpecs')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read', 'haccp_registre:read'])]
    private ?HaccpEquipement $equipement = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: self::TYPES)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read', 'haccp_registre:read'])]
    private string $typeReleve = self::TYPE_TEMPERATURE;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Choice(choices: self::MOMENTS, message: 'Moment invalide.', match: true)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read', 'haccp_registre:read'])]
    private ?string $moment = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read'])]
    private ?string $seuilMin = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read'])]
    private ?string $seuilMax = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read'])]
    private ?string $unite = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read'])]
    private bool $photoObligatoire = false;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['haccp_spec:read', 'haccp_spec:write', 'mission:read'])]
    private bool $commentaireObligatoire = false;

    /**
     * Permet au générateur de désactiver une mission T° (équipement off) sans
     * casser l'historique des completions associées. Pas de modif structurelle
     * sur Mission (cf. CLAUDE.md).
     */
    #[ORM\Column(options: ['default' => false])]
    #[Groups(['haccp_spec:read', 'mission:read'])]
    private bool $archivee = false;

    #[ORM\Column]
    #[Groups(['haccp_spec:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['haccp_spec:read'])]
    private ?\DateTime $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function touch(): void { $this->updatedAt = new \DateTime(); }

    public function getId(): ?int { return $this->id; }

    public function getMission(): ?Mission { return $this->mission; }
    public function setMission(?Mission $m): static { $this->mission = $m; return $this; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }

    public function getEquipement(): ?HaccpEquipement { return $this->equipement; }
    public function setEquipement(?HaccpEquipement $e): static { $this->equipement = $e; return $this; }

    public function getTypeReleve(): string { return $this->typeReleve; }
    public function setTypeReleve(string $t): static { $this->typeReleve = $t; return $this; }

    public function getMoment(): ?string { return $this->moment; }
    public function setMoment(?string $m): static { $this->moment = $m; return $this; }

    public function getSeuilMin(): ?float { return $this->seuilMin === null ? null : (float) $this->seuilMin; }
    public function setSeuilMin(?float $v): static { $this->seuilMin = $v === null ? null : number_format($v, 2, '.', ''); return $this; }

    public function getSeuilMax(): ?float { return $this->seuilMax === null ? null : (float) $this->seuilMax; }
    public function setSeuilMax(?float $v): static { $this->seuilMax = $v === null ? null : number_format($v, 2, '.', ''); return $this; }

    public function getUnite(): ?string { return $this->unite; }
    public function setUnite(?string $u): static { $this->unite = $u; return $this; }

    public function isPhotoObligatoire(): bool { return $this->photoObligatoire; }
    public function setPhotoObligatoire(bool $b): static { $this->photoObligatoire = $b; return $this; }

    public function isCommentaireObligatoire(): bool { return $this->commentaireObligatoire; }
    public function setCommentaireObligatoire(bool $b): static { $this->commentaireObligatoire = $b; return $this; }

    public function isArchivee(): bool { return $this->archivee; }
    public function setArchivee(bool $a): static { $this->archivee = $a; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTime { return $this->updatedAt; }

    /**
     * Résout les seuils effectifs (équipement prioritaire sur spec standalone).
     * @return array{min:?float,max:?float,unite:?string}
     */
    public function getEffectiveSeuils(): array
    {
        if ($this->equipement) {
            return [
                'min'   => $this->equipement->getSeuilMin(),
                'max'   => $this->equipement->getSeuilMax(),
                'unite' => $this->equipement->getUnite(),
            ];
        }
        return ['min' => $this->getSeuilMin(), 'max' => $this->getSeuilMax(), 'unite' => $this->unite];
    }
}

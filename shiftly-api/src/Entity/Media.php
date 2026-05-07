<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use App\Enum\MediaEntityType;
use App\Repository\MediaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Média polymorphe (image ou PDF) attaché à une entité parente
 * (mission, tutoriel, document plus tard) via la combo entityType + entityId.
 *
 * Pas de FK SQL vers Mission/Tutoriel : la relation logique est gérée par
 * MediaRepository::findByEntity() et nettoyée par les EntityListener
 * dédiés (MissionMediaCleanupListener, TutorielMediaCleanupListener).
 *
 * GetCollection désactivé (jamais de listing global). Le listing se fait via
 * MediaController par entité parente (sub-resource custom).
 */
#[ORM\Entity(repositoryClass: MediaRepository::class)]
#[ORM\Table(name: 'media')]
#[ORM\Index(name: 'idx_media_entity', columns: ['entity_type', 'entity_id', 'centre_id'])]
#[ApiResource(
    operations: [
        new Get(security: "is_granted('MEDIA_VIEW', object)"),
        new Delete(security: "is_granted('ROLE_MANAGER') and is_granted('MEDIA_DELETE', object)"),
    ],
    normalizationContext:   ['groups' => ['media:read']],
    denormalizationContext: ['groups' => ['media:write']],
)]
class Media
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['media:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['media:read'])]
    private ?Centre $centre = null;

    /** Type d'entité parente — VARCHAR(20) portable (pas d'ENUM MySQL). */
    #[ORM\Column(type: 'string', enumType: MediaEntityType::class, length: 20)]
    #[Groups(['media:read'])]
    private MediaEntityType $entityType;

    #[ORM\Column]
    #[Groups(['media:read'])]
    private int $entityId;

    #[ORM\Column(length: 255)]
    #[Groups(['media:read'])]
    private string $filename;

    #[ORM\Column(length: 100)]
    #[Groups(['media:read'])]
    private string $mimeType;

    #[ORM\Column]
    #[Groups(['media:read'])]
    private int $sizeBytes = 0;

    /** Clé R2 (ex : "1/media/mission/uuid.jpg"). Jamais exposée à l'URL signée près. */
    #[ORM\Column(length: 500)]
    #[Groups(['media:read'])]
    private string $storagePath;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['media:read'])]
    private ?User $uploadedBy = null;

    #[ORM\Column]
    #[Groups(['media:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(Centre $centre): static { $this->centre = $centre; return $this; }

    public function getEntityType(): MediaEntityType { return $this->entityType; }
    public function setEntityType(MediaEntityType $type): static { $this->entityType = $type; return $this; }

    public function getEntityId(): int { return $this->entityId; }
    public function setEntityId(int $id): static { $this->entityId = $id; return $this; }

    public function getFilename(): string { return $this->filename; }
    public function setFilename(string $filename): static { $this->filename = $filename; return $this; }

    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mime): static { $this->mimeType = $mime; return $this; }

    public function getSizeBytes(): int { return $this->sizeBytes; }
    public function setSizeBytes(int $size): static { $this->sizeBytes = $size; return $this; }

    public function getStoragePath(): string { return $this->storagePath; }
    public function setStoragePath(string $path): static { $this->storagePath = $path; return $this; }

    public function getUploadedBy(): ?User { return $this->uploadedBy; }
    public function setUploadedBy(User $user): static { $this->uploadedBy = $user; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}

<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\ContactRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Contact CRM d'un centre, dérivé des réservations et demandes B2B. Isolé par
 * `centre` et DÉDUPLIQUÉ par email au sein du centre (unicité sur centre + emailHash).
 *
 * PII (nom, email, téléphone) CHIFFRÉES au repos (type `encrypted_string`) : en base
 * seul du ciphertext apparaît. La déduplication se fait via `emailHash` (hash HMAC
 * déterministe), jamais via l'email en clair.
 */
#[ORM\Entity(repositoryClass: ContactRepository::class)]
#[ORM\Table(name: 'contact')]
#[ORM\Index(name: 'idx_contact_centre', columns: ['centre_id'])]
#[ORM\UniqueConstraint(name: 'uniq_contact_centre_email', columns: ['centre_id', 'email_hash'])]
#[ApiResource(
    normalizationContext: ['groups' => ['contact:read']],
    denormalizationContext: ['groups' => ['contact:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
    ],
)]
class Contact
{
    public const SEGMENT_B2C = 'b2c';
    public const SEGMENT_B2B = 'b2b';
    public const SEGMENT_NO_SHOW = 'no_show';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['contact:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\Column(type: 'encrypted_string')]
    #[Groups(['contact:read'])]
    private ?string $nom = null;

    #[ORM\Column(type: 'encrypted_string')]
    #[Groups(['contact:read'])]
    private ?string $email = null;

    #[ORM\Column(type: 'encrypted_string', nullable: true)]
    #[Groups(['contact:read'])]
    private ?string $telephone = null;

    /** Hash déterministe de l'email (dédup + unicité par centre) — jamais l'email en clair. */
    #[ORM\Column(length: 64)]
    private ?string $emailHash = null;

    /**
     * Segments du contact (b2c, b2b, no_show…).
     *
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['contact:read', 'contact:write'])]
    private array $segments = [];

    #[ORM\Column]
    #[Groups(['contact:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['contact:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    /** Ajoute un segment s'il n'y est pas déjà. */
    public function addSegment(string $segment): void
    {
        if (!\in_array($segment, $this->segments, true)) {
            $this->segments[] = $segment;
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCentre(): ?Centre
    {
        return $this->centre;
    }

    public function setCentre(?Centre $centre): static
    {
        $this->centre = $centre;

        return $this;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(?string $telephone): static
    {
        $this->telephone = $telephone;

        return $this;
    }

    public function getEmailHash(): ?string
    {
        return $this->emailHash;
    }

    public function setEmailHash(string $emailHash): static
    {
        $this->emailHash = $emailHash;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getSegments(): array
    {
        return $this->segments;
    }

    /**
     * @param list<string> $segments
     */
    public function setSegments(array $segments): static
    {
        $this->segments = array_values(array_unique($segments));

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * Antidatage des jeux de données (fixtures de démo, reprise d'historique lors
     * d'un import). Aucun groupe de sérialisation : jamais écrivable via l'API.
     */
    public function setCreatedAt(?\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }
}

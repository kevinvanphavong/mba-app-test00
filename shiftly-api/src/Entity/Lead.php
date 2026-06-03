<?php

namespace App\Entity;

use App\Repository\LeadRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Lead — prospect public capturé depuis la landing shiftly.fr.
 * Pas multi-tenant (pas de centre_id) : c'est un prospect, pas un user.
 * Workflow : nouveau → contacte → qualifie → converti | perdu
 */
#[ORM\Entity(repositoryClass: LeadRepository::class)]
#[ORM\Table(name: '`lead`')]
#[ORM\Index(name: 'idx_lead_status', columns: ['status'])]
#[ORM\Index(name: 'idx_lead_created_at', columns: ['created_at'])]
#[ORM\Index(name: 'idx_lead_intent', columns: ['intent'])]
#[ORM\HasLifecycleCallbacks]
class Lead
{
    // Intent — quel formulaire de la modale landing a été soumis
    public const INTENT_TRIAL  = 'trial';
    public const INTENT_DEMO   = 'demo';
    public const INTENT_CUSTOM = 'custom';

    // Plan envisagé par le prospect
    public const PLAN_STARTER   = 'starter';
    public const PLAN_PRO       = 'pro';
    public const PLAN_PREMIUM   = 'premium';
    public const PLAN_UNDECIDED = 'undecided';

    // Workflow interne
    public const STATUS_NOUVEAU   = 'nouveau';
    public const STATUS_CONTACTE  = 'contacte';
    public const STATUS_QUALIFIE  = 'qualifie';
    public const STATUS_CONVERTI  = 'converti';
    public const STATUS_PERDU     = 'perdu';

    // Canal demo
    public const CHANNEL_MEET  = 'meet';
    public const CHANNEL_ZOOM  = 'zoom';
    public const CHANNEL_TEAMS = 'teams';
    public const CHANNEL_PHONE = 'phone';

    // Type d'activité du centre prospect
    public const ACTIVITY_BOWLING = 'bowling';
    public const ACTIVITY_LASER   = 'laser';
    public const ACTIVITY_ARCADE  = 'arcade';
    public const ACTIVITY_KARAOKE = 'karaoke';
    public const ACTIVITY_VR      = 'vr';
    public const ACTIVITY_MIXTE   = 'mixte';
    public const ACTIVITY_AUTRE   = 'autre';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private string $intent = self::INTENT_TRIAL;

    #[ORM\Column(length: 20)]
    private string $plan = self::PLAN_UNDECIDED;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(length: 180)]
    private string $email = '';

    #[ORM\Column(length: 30)]
    private string $phone = '';

    #[ORM\Column(length: 180)]
    private string $centre = '';

    #[ORM\Column(length: 30)]
    private string $activity = self::ACTIVITY_AUTRE;

    #[ORM\Column(length: 20)]
    private string $staffSize = '';

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $zip = null;

    /** Démo : créneau préféré saisi en clair. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $preferredSlot = null;

    /** Démo : canal souhaité (meet / zoom / teams / phone). */
    #[ORM\Column(length: 20, nullable: true)]
    private ?string $channel = null;

    /** Sur-mesure : description des besoins spécifiques. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $customNeeds = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $message = null;

    #[ORM\Column]
    private bool $consent = false;

    /** Horodatage du consentement RGPD (preuve légale). */
    #[ORM\Column]
    private ?\DateTimeImmutable $consentAt = null;

    /** Source d'acquisition (ex: "shiftly.fr (landing /)"). */
    #[ORM\Column(length: 80)]
    private string $source = 'inconnu';

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_NOUVEAU;

    /** Journal interne Kévin (notes commerciales). */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $handledBy = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $handledAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getIntent(): string { return $this->intent; }
    public function setIntent(string $intent): static { $this->intent = $intent; return $this; }

    public function getPlan(): string { return $this->plan; }
    public function setPlan(string $plan): static { $this->plan = $plan; return $this; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getPhone(): string { return $this->phone; }
    public function setPhone(string $phone): static { $this->phone = $phone; return $this; }

    public function getCentre(): string { return $this->centre; }
    public function setCentre(string $centre): static { $this->centre = $centre; return $this; }

    public function getActivity(): string { return $this->activity; }
    public function setActivity(string $activity): static { $this->activity = $activity; return $this; }

    public function getStaffSize(): string { return $this->staffSize; }
    public function setStaffSize(string $staffSize): static { $this->staffSize = $staffSize; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }

    public function getZip(): ?string { return $this->zip; }
    public function setZip(?string $zip): static { $this->zip = $zip; return $this; }

    public function getPreferredSlot(): ?string { return $this->preferredSlot; }
    public function setPreferredSlot(?string $v): static { $this->preferredSlot = $v; return $this; }

    public function getChannel(): ?string { return $this->channel; }
    public function setChannel(?string $channel): static { $this->channel = $channel; return $this; }

    public function getCustomNeeds(): ?string { return $this->customNeeds; }
    public function setCustomNeeds(?string $v): static { $this->customNeeds = $v; return $this; }

    public function getMessage(): ?string { return $this->message; }
    public function setMessage(?string $message): static { $this->message = $message; return $this; }

    public function getConsent(): bool { return $this->consent; }
    public function setConsent(bool $consent): static { $this->consent = $consent; return $this; }

    public function getConsentAt(): ?\DateTimeImmutable { return $this->consentAt; }
    public function setConsentAt(\DateTimeImmutable $at): static { $this->consentAt = $at; return $this; }

    public function getSource(): string { return $this->source; }
    public function setSource(string $source): static { $this->source = $source; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getHandledBy(): ?User { return $this->handledBy; }
    public function setHandledBy(?User $u): static { $this->handledBy = $u; return $this; }

    public function getHandledAt(): ?\DateTimeImmutable { return $this->handledAt; }
    public function setHandledAt(?\DateTimeImmutable $at): static { $this->handledAt = $at; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $at): static { $this->createdAt = $at; return $this; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
}

<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\SubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Abonnement récurrent d'un centre facturé par l'AGENCE via Stripe Billing (distinct
 * de l'acompte des clients finaux). Un abonnement par centre (unique). Créé/mis à jour
 * à l'assignation d'un {@see Plan}. Aucune donnée carte ; montants en CENTIMES.
 *
 * Ressource GLOBALE (pas scopée par tenant) exposée en LECTURE au super-admin
 * (`/api/superadmin/subscriptions`, ROLE_SUPERADMIN). Le pilotage passe par les services.
 */
#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ORM\Table(name: 'subscription')]
#[ApiResource(
    routePrefix: '/superadmin',
    normalizationContext: ['groups' => ['subscription:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_SUPERADMIN')"),
        new Get(security: "is_granted('ROLE_SUPERADMIN')"),
    ],
    order: ['createdAt' => 'DESC'],
)]
class Subscription
{
    public const STATUT_ACTIVE = 'active';
    public const STATUT_PAST_DUE = 'past_due';
    public const STATUT_CANCELED = 'canceled';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['subscription:read'])]
    private ?int $id = null;

    /** Un abonnement par centre (unique). */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, unique: true, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: Plan::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Plan $plan = null;

    #[ORM\Column(length: 255)]
    private ?string $stripeCustomerId = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Groups(['subscription:read'])]
    private ?string $stripeSubscriptionId = null;

    #[ORM\Column(length: 30)]
    #[Groups(['subscription:read'])]
    private string $statut = self::STATUT_ACTIVE;

    #[ORM\Column]
    #[Groups(['subscription:read'])]
    private int $montantCents = 0;

    #[ORM\Column]
    #[Groups(['subscription:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
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

    #[Groups(['subscription:read'])]
    public function getCentreNom(): ?string
    {
        return $this->centre?->getNom();
    }

    public function getPlan(): ?Plan
    {
        return $this->plan;
    }

    public function setPlan(?Plan $plan): static
    {
        $this->plan = $plan;

        return $this;
    }

    #[Groups(['subscription:read'])]
    public function getPlanNom(): ?string
    {
        return $this->plan?->getNom();
    }

    public function getStripeCustomerId(): ?string
    {
        return $this->stripeCustomerId;
    }

    public function setStripeCustomerId(string $stripeCustomerId): static
    {
        $this->stripeCustomerId = $stripeCustomerId;

        return $this;
    }

    public function getStripeSubscriptionId(): ?string
    {
        return $this->stripeSubscriptionId;
    }

    public function setStripeSubscriptionId(string $stripeSubscriptionId): static
    {
        $this->stripeSubscriptionId = $stripeSubscriptionId;

        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getMontantCents(): int
    {
        return $this->montantCents;
    }

    public function setMontantCents(int $montantCents): static
    {
        $this->montantCents = max(0, $montantCents);

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

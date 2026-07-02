<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\InvoiceRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Facture d'abonnement agence, reflet d'une facture Stripe. Enregistrée par le webhook
 * signé (`invoice.paid` / `invoice.payment_failed`). Idempotence garantie par l'unicité
 * de `stripeInvoiceId` : un event rejoué ne crée jamais de doublon. Montants en CENTIMES.
 *
 * Ressource GLOBALE exposée en LECTURE au super-admin (`/api/superadmin/invoices`).
 */
#[ORM\Entity(repositoryClass: InvoiceRepository::class)]
#[ORM\Table(name: 'invoice')]
#[ApiResource(
    routePrefix: '/superadmin',
    normalizationContext: ['groups' => ['invoice:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_SUPERADMIN')"),
        new Get(security: "is_granted('ROLE_SUPERADMIN')"),
    ],
    order: ['createdAt' => 'DESC'],
)]
class Invoice
{
    public const STATUT_PAID = 'paid';
    public const STATUT_FAILED = 'payment_failed';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['invoice:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    /** Id Stripe de la facture : clé d'idempotence (unique). */
    #[ORM\Column(length: 255, unique: true)]
    #[Groups(['invoice:read'])]
    private ?string $stripeInvoiceId = null;

    #[ORM\Column]
    #[Groups(['invoice:read'])]
    private int $montantCents = 0;

    #[ORM\Column(length: 30)]
    #[Groups(['invoice:read'])]
    private string $statut = self::STATUT_PAID;

    #[ORM\Column]
    #[Groups(['invoice:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
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

    #[Groups(['invoice:read'])]
    public function getCentreNom(): ?string
    {
        return $this->centre?->getNom();
    }

    public function getStripeInvoiceId(): ?string
    {
        return $this->stripeInvoiceId;
    }

    public function setStripeInvoiceId(string $stripeInvoiceId): static
    {
        $this->stripeInvoiceId = $stripeInvoiceId;

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

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\ReservationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Réservation B2C (invité) prise depuis le site public d'un centre (Branche 1).
 *
 * Un visiteur **sans compte** réserve une prestation pour un créneau : on fige le
 * montant total (prix prestation × personnes) et l'acompte dû. Le paiement réel
 * (Stripe) confirme la réservation via webhook signé.
 *
 * Isolation tenant : toute réservation appartient à un `centre` (FK non nulle) et
 * ne peut référencer qu'une prestation **du même centre**. **Écriture** publique
 * uniquement via {@see \App\Controller\Web\PublicReservationController}. **Lecture
 * gérant** via API Platform (GetCollection/Get, ROLE_MANAGER), isolée par
 * CentreQueryExtension + {@see \App\Security\Voter\ReservationVoter}. Aucune donnée
 * carte n'existe ni n'est exposée (Checkout hébergé Stripe).
 */
#[ORM\Entity(repositoryClass: ReservationRepository::class)]
#[ORM\Table(name: 'reservation')]
#[ORM\Index(name: 'idx_reservation_centre', columns: ['centre_id'])]
// Idempotence de l'ingestion externe : une même référence source ne crée qu'UNE résa
// par centre. Les résas du site public (source/sourceRef NULL) restent distinctes (NULLs).
#[ORM\UniqueConstraint(name: 'uniq_reservation_source', columns: ['centre_id', 'source', 'source_ref'])]
#[ApiResource(
    normalizationContext: ['groups' => ['reservation:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
    ],
)]
#[ApiFilter(SearchFilter::class, properties: ['statut' => 'exact'])]
#[ApiFilter(DateFilter::class, properties: ['dateCreneau'])]
#[ApiFilter(OrderFilter::class, properties: ['dateCreneau', 'createdAt'])]
class Reservation
{
    /** Réservation créée, en attente du règlement de l'acompte (aucun paiement traité). */
    public const STATUT_EN_ATTENTE_ACOMPTE = 'EN_ATTENTE_ACOMPTE';

    /** Acompte encaissé (webhook Stripe signé) : réservation confirmée. */
    public const STATUT_CONFIRMEE = 'CONFIRMEE';

    /** Réservation refusée/annulée (source externe : statut FGC `refuse`). */
    public const STATUT_ANNULEE = 'ANNULEE';

    /** Réservation passée / honorée (source externe : statut FGC `passe`). */
    public const STATUT_TERMINEE = 'TERMINEE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['reservation:read'])]
    private ?int $id = null;

    /** Tenant propriétaire : isolation par centre. */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    /**
     * Prestation réservée (site public). NULLABLE : une réservation ingérée depuis un
     * système externe peut n'avoir aucune prestation Shiftly correspondante — sa formule
     * est alors conservée en libellé libre ({@see $formule}).
     */
    #[ORM\ManyToOne(targetEntity: Prestation::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Prestation $prestation = null;

    /** Origine de la réservation (ex. `fgc-web`). NULL = réservation native du site public. */
    #[ORM\Column(length: 40, nullable: true)]
    #[Groups(['reservation:read'])]
    private ?string $source = null;

    /** Référence externe (idempotence). Unique par `(centre, source)`. */
    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['reservation:read'])]
    private ?string $sourceRef = null;

    /** Libellé de la formule externe quand aucune prestation Shiftly ne correspond. */
    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['reservation:read'])]
    private ?string $formule = null;

    /** Créneau réservé (date + heure). */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['reservation:read'])]
    private ?\DateTimeImmutable $dateCreneau = null;

    #[ORM\Column]
    #[Groups(['reservation:read'])]
    private int $nbPersonnes = 1;

    #[ORM\Column(length: 120)]
    #[Groups(['reservation:read'])]
    private ?string $nomInvite = null;

    #[ORM\Column(length: 180)]
    #[Groups(['reservation:read'])]
    private ?string $emailInvite = null;

    #[ORM\Column(length: 30)]
    #[Groups(['reservation:read'])]
    private ?string $telephoneInvite = null;

    /** Montant total figé en **centimes** (prix prestation × personnes au moment de la résa). */
    #[ORM\Column]
    #[Groups(['reservation:read'])]
    private int $montantTotalCents = 0;

    /** Acompte dû en **centimes** (part du total, cf. taux paramétrable côté service). */
    #[ORM\Column]
    #[Groups(['reservation:read'])]
    private int $acompteCents = 0;

    #[ORM\Column(length: 30)]
    #[Groups(['reservation:read'])]
    private string $statut = self::STATUT_EN_ATTENTE_ACOMPTE;

    /** Id de la session Stripe Checkout de l'acompte (traçabilité, lien paiement↔résa). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stripeSessionId = null;

    /** Horodatage de l'encaissement de l'acompte (confirmation via webhook). */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['reservation:read'])]
    private ?\DateTimeImmutable $paidAt = null;

    #[ORM\Column]
    #[Groups(['reservation:read'])]
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

    public function getPrestation(): ?Prestation
    {
        return $this->prestation;
    }

    /** Nom de la prestation (ou libellé de la formule externe), exposé au gérant. */
    #[Groups(['reservation:read'])]
    public function getPrestationNom(): ?string
    {
        return $this->prestation?->getNom() ?? $this->formule;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): static
    {
        $this->source = $source;

        return $this;
    }

    public function getSourceRef(): ?string
    {
        return $this->sourceRef;
    }

    public function setSourceRef(?string $sourceRef): static
    {
        $this->sourceRef = $sourceRef;

        return $this;
    }

    public function getFormule(): ?string
    {
        return $this->formule;
    }

    public function setFormule(?string $formule): static
    {
        $this->formule = $formule;

        return $this;
    }

    public function setPrestation(?Prestation $prestation): static
    {
        $this->prestation = $prestation;

        return $this;
    }

    public function getDateCreneau(): ?\DateTimeImmutable
    {
        return $this->dateCreneau;
    }

    public function setDateCreneau(?\DateTimeImmutable $dateCreneau): static
    {
        $this->dateCreneau = $dateCreneau;

        return $this;
    }

    public function getNbPersonnes(): int
    {
        return $this->nbPersonnes;
    }

    public function setNbPersonnes(int $nbPersonnes): static
    {
        $this->nbPersonnes = $nbPersonnes;

        return $this;
    }

    public function getNomInvite(): ?string
    {
        return $this->nomInvite;
    }

    public function setNomInvite(string $nomInvite): static
    {
        $this->nomInvite = $nomInvite;

        return $this;
    }

    public function getEmailInvite(): ?string
    {
        return $this->emailInvite;
    }

    public function setEmailInvite(string $emailInvite): static
    {
        $this->emailInvite = $emailInvite;

        return $this;
    }

    public function getTelephoneInvite(): ?string
    {
        return $this->telephoneInvite;
    }

    public function setTelephoneInvite(string $telephoneInvite): static
    {
        $this->telephoneInvite = $telephoneInvite;

        return $this;
    }

    public function getMontantTotalCents(): int
    {
        return $this->montantTotalCents;
    }

    public function setMontantTotalCents(int $montantTotalCents): static
    {
        $this->montantTotalCents = $montantTotalCents;

        return $this;
    }

    public function getAcompteCents(): int
    {
        return $this->acompteCents;
    }

    public function setAcompteCents(int $acompteCents): static
    {
        $this->acompteCents = $acompteCents;

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

    public function isConfirmee(): bool
    {
        return self::STATUT_CONFIRMEE === $this->statut;
    }

    public function getStripeSessionId(): ?string
    {
        return $this->stripeSessionId;
    }

    public function setStripeSessionId(?string $stripeSessionId): static
    {
        $this->stripeSessionId = $stripeSessionId;

        return $this;
    }

    public function getPaidAt(): ?\DateTimeImmutable
    {
        return $this->paidAt;
    }

    public function setPaidAt(?\DateTimeImmutable $paidAt): static
    {
        $this->paidAt = $paidAt;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

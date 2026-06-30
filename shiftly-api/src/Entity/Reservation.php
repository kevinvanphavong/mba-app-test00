<?php

namespace App\Entity;

use App\Repository\ReservationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Réservation B2C (invité) prise depuis le site public d'un centre (Branche 1).
 *
 * Un visiteur **sans compte** réserve une prestation pour un créneau : on fige le
 * montant total (prix prestation × personnes) et l'acompte dû. Le paiement réel
 * (Stripe) et le compte client sont des chantiers ultérieurs — ici la réservation
 * naît au statut {@see self::STATUT_EN_ATTENTE_ACOMPTE}, rien n'est encaissé.
 *
 * Isolation tenant : toute réservation appartient à un `centre` (FK non nulle) et
 * ne peut référencer qu'une prestation **du même centre** (vérifié explicitement
 * côté service, pattern des contrôleurs publics). **Pas exposée via API Platform** :
 * la seule écriture passe par {@see \App\Controller\Web\PublicReservationController}.
 */
#[ORM\Entity(repositoryClass: ReservationRepository::class)]
#[ORM\Table(name: 'reservation')]
#[ORM\Index(name: 'idx_reservation_centre', columns: ['centre_id'])]
class Reservation
{
    /** Réservation créée, en attente du règlement de l'acompte (aucun paiement traité). */
    public const STATUT_EN_ATTENTE_ACOMPTE = 'EN_ATTENTE_ACOMPTE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    /** Tenant propriétaire : isolation par centre. */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    /** Prestation réservée — garantie du même centre que la réservation (service). */
    #[ORM\ManyToOne(targetEntity: Prestation::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private ?Prestation $prestation = null;

    /** Créneau réservé (date + heure). */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $dateCreneau = null;

    #[ORM\Column]
    private int $nbPersonnes = 1;

    #[ORM\Column(length: 120)]
    private ?string $nomInvite = null;

    #[ORM\Column(length: 180)]
    private ?string $emailInvite = null;

    #[ORM\Column(length: 30)]
    private ?string $telephoneInvite = null;

    /** Montant total figé en **centimes** (prix prestation × personnes au moment de la résa). */
    #[ORM\Column]
    private int $montantTotalCents = 0;

    /** Acompte dû en **centimes** (part du total, cf. taux paramétrable côté service). */
    #[ORM\Column]
    private int $acompteCents = 0;

    #[ORM\Column(length: 30)]
    private string $statut = self::STATUT_EN_ATTENTE_ACOMPTE;

    #[ORM\Column]
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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

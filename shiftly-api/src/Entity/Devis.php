<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\DevisRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Devis rattaché à une {@see DemandeB2B}, pré-rempli par l'IA (statut BROUILLON).
 * Isolé par `centre`. Éditable par le gérant, **jamais envoyé automatiquement**.
 *
 * Montants en CENTIMES, figés à la génération et calculés côté serveur (jamais
 * fournis/recalculés par le client) : chaque ligne porte son `montantCents`
 * (= quantité × prix unitaire) et le `totalCents` est leur somme.
 */
#[ORM\Entity(repositoryClass: DevisRepository::class)]
#[ORM\Table(name: 'devis')]
#[ORM\Index(name: 'idx_devis_centre', columns: ['centre_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['devis:read']],
    denormalizationContext: ['groups' => ['devis:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        // Le gérant édite le brouillon (statut, notes) ; total/lignes restent figés.
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
    ],
)]
class Devis
{
    public const STATUT_BROUILLON = 'BROUILLON';
    public const STATUT_ENVOYE = 'ENVOYE';
    public const STATUT_ACCEPTE = 'ACCEPTE';
    public const STATUT_REFUSE = 'REFUSE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['devis:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: DemandeB2B::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?DemandeB2B $demande = null;

    /**
     * Lignes du devis, figées en centimes.
     *
     * @var list<array{designation: string, quantite: int, prixUnitaireCents: int, montantCents: int}>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['devis:read'])]
    private array $lignes = [];

    #[ORM\Column]
    #[Groups(['devis:read'])]
    private int $totalCents = 0;

    #[ORM\Column(length: 30)]
    #[Groups(['devis:read', 'devis:write'])]
    private string $statut = self::STATUT_BROUILLON;

    /** Notes libres du gérant sur le brouillon (éditable). */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['devis:read', 'devis:write'])]
    private ?string $notes = null;

    #[ORM\Column]
    #[Groups(['devis:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['devis:read'])]
    public function getDemandeId(): ?int
    {
        return $this->demande?->getId();
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

    public function getDemande(): ?DemandeB2B
    {
        return $this->demande;
    }

    public function setDemande(?DemandeB2B $demande): static
    {
        $this->demande = $demande;

        return $this;
    }

    /**
     * @return list<array{designation: string, quantite: int, prixUnitaireCents: int, montantCents: int}>
     */
    public function getLignes(): array
    {
        return $this->lignes;
    }

    /**
     * @param list<array{designation: string, quantite: int, prixUnitaireCents: int, montantCents: int}> $lignes
     */
    public function setLignes(array $lignes): static
    {
        $this->lignes = $lignes;

        return $this;
    }

    public function getTotalCents(): int
    {
        return $this->totalCents;
    }

    public function setTotalCents(int $totalCents): static
    {
        $this->totalCents = $totalCents;

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

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

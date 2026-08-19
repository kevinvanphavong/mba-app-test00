<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\RelanceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Relance d'un contact (ex. no-show). Créée AUTOMATIQUEMENT (async, Messenger) mais
 * en BROUILLON : l'IA rédige `texte` en best-effort (vide si quota/IA KO), et c'est
 * un HUMAIN qui l'envoie (endpoint dédié). L'IA n'envoie jamais seule.
 *
 * Isolée par `centre`. La planification ne dépend PAS de l'IA (task 5).
 */
#[ORM\Entity(repositoryClass: RelanceRepository::class)]
#[ORM\Table(name: 'relance')]
#[ORM\Index(name: 'idx_relance_centre', columns: ['centre_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['relance:read']],
    denormalizationContext: ['groups' => ['relance:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
    ],
)]
class Relance
{
    public const MOTIF_NO_SHOW = 'NO_SHOW';

    /** Brouillon à rédiger (l'IA n'a pas pu proposer de texte). */
    public const STATUT_A_REDIGER = 'A_REDIGER';
    /** Texte prêt, en attente d'envoi par le gérant (garde humaine). */
    public const STATUT_A_ENVOYER = 'A_ENVOYER';
    public const STATUT_ENVOYEE = 'ENVOYEE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['relance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: Contact::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Contact $contact = null;

    #[ORM\Column(length: 20)]
    #[Groups(['relance:read'])]
    private string $motif = self::MOTIF_NO_SHOW;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['relance:read', 'relance:write'])]
    private ?string $texte = null;

    #[ORM\Column(length: 20)]
    #[Groups(['relance:read', 'relance:write'])]
    private string $statut = self::STATUT_A_REDIGER;

    #[ORM\Column]
    #[Groups(['relance:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['relance:read'])]
    private ?\DateTimeImmutable $sentAt = null;

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

    public function getContact(): ?Contact
    {
        return $this->contact;
    }

    /** Nom du contact ciblé (déchiffré, gérant autorisé du centre) — pour l'affichage. */
    #[Groups(['relance:read'])]
    public function getContactNom(): ?string
    {
        return $this->contact?->getNom();
    }

    public function setContact(?Contact $contact): static
    {
        $this->contact = $contact;

        return $this;
    }

    public function getMotif(): string
    {
        return $this->motif;
    }

    public function setMotif(string $motif): static
    {
        $this->motif = $motif;

        return $this;
    }

    public function getTexte(): ?string
    {
        return $this->texte;
    }

    public function setTexte(?string $texte): static
    {
        $this->texte = $texte;

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

    /**
     * Antidatage des jeux de données (fixtures de démo, reprise d'historique lors
     * d'un import). Aucun groupe de sérialisation : jamais écrivable via l'API.
     */
    public function setCreatedAt(?\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getSentAt(): ?\DateTimeImmutable
    {
        return $this->sentAt;
    }

    /**
     * Antidatage des jeux de données (fixtures de démo, reprise d'historique lors
     * d'un import). Aucun groupe de sérialisation : jamais écrivable via l'API.
     */
    public function setSentAt(?\DateTimeImmutable $sentAt): static
    {
        $this->sentAt = $sentAt;

        return $this;
    }

    public function marquerEnvoyee(): void
    {
        $this->statut = self::STATUT_ENVOYEE;
        $this->sentAt = new \DateTimeImmutable();
    }
}

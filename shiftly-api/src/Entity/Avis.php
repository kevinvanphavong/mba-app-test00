<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\AvisRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Avis post-visite laissé par un visiteur, rattaché au centre (et au contact si connu).
 * Isolé par `centre`. Le gérant peut y répondre — la réponse peut être pré-rédigée par
 * l'IA (best-effort) mais n'est JAMAIS publiée/envoyée sans validation humaine.
 */
#[ORM\Entity(repositoryClass: AvisRepository::class)]
#[ORM\Table(name: 'avis')]
#[ORM\Index(name: 'idx_avis_centre', columns: ['centre_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['avis:read']],
    denormalizationContext: ['groups' => ['avis:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
    ],
)]
class Avis
{
    public const STATUT_NOUVEAU = 'NOUVEAU';
    public const STATUT_REPONDU = 'REPONDU';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['avis:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: Contact::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Contact $contact = null;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['avis:read'])]
    private int $note = 5;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['avis:read'])]
    private ?string $commentaire = null;

    /** Réponse du gérant (éventuellement pré-rédigée par l'IA) — publiée manuellement. */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['avis:read', 'avis:write'])]
    private ?string $reponse = null;

    #[ORM\Column(length: 20)]
    #[Groups(['avis:read', 'avis:write'])]
    private string $statut = self::STATUT_NOUVEAU;

    #[ORM\Column]
    #[Groups(['avis:read'])]
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

    public function getContact(): ?Contact
    {
        return $this->contact;
    }

    /** Nom du contact auteur, si connu (déchiffré, gérant autorisé) — pour l'affichage. */
    #[Groups(['avis:read'])]
    public function getContactNom(): ?string
    {
        return $this->contact?->getNom();
    }

    public function setContact(?Contact $contact): static
    {
        $this->contact = $contact;

        return $this;
    }

    public function getNote(): int
    {
        return $this->note;
    }

    public function setNote(int $note): static
    {
        $this->note = $note;

        return $this;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(?string $commentaire): static
    {
        $this->commentaire = $commentaire;

        return $this;
    }

    public function getReponse(): ?string
    {
        return $this->reponse;
    }

    public function setReponse(?string $reponse): static
    {
        $this->reponse = $reponse;

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
}

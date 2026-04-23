<?php

namespace App\Entity;

use App\Repository\SupportTicketRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SupportTicketRepository::class)]
#[ORM\Table(name: 'support_ticket')]
#[ORM\HasLifecycleCallbacks]
class SupportTicket
{
    const STATUT_OUVERT   = 'OUVERT';
    const STATUT_EN_COURS = 'EN_COURS';
    const STATUT_RESOLU   = 'RESOLU';
    const STATUT_FERME    = 'FERME';

    const PRIORITE_BASSE    = 'BASSE';
    const PRIORITE_MOYENNE  = 'MOYENNE';
    const PRIORITE_HAUTE    = 'HAUTE';
    const PRIORITE_URGENTE  = 'URGENTE';

    const CATEGORIE_BUG              = 'bug';
    const CATEGORIE_QUESTION         = 'question';
    const CATEGORIE_FEATURE_REQUEST  = 'feature_request';
    const CATEGORIE_FACTURATION      = 'facturation';
    const CATEGORIE_AUTRE            = 'autre';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $auteur = null;

    #[ORM\Column(length: 200)]
    private ?string $sujet = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    #[ORM\Column(length: 30)]
    private string $categorie = self::CATEGORIE_QUESTION;

    #[ORM\Column(length: 20)]
    private string $statut = self::STATUT_OUVERT;

    #[ORM\Column(length: 20)]
    private string $priorite = self::PRIORITE_MOYENNE;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $assigneA = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $closedAt = null;

    /** Timestamp de la dernière vue par un SuperAdmin (toute réponse postérieure est non-lue côté SA) */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastViewedBySuperAdmin = null;

    /** Timestamp de la dernière vue par l'auteur du ticket (pour la cloche manager) */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastViewedByAuthor = null;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: SupportReply::class, cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $replies;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: SupportAttachment::class, cascade: ['persist', 'remove'])]
    private Collection $attachments;

    public function __construct()
    {
        $this->replies     = new ArrayCollection();
        $this->attachments = new ArrayCollection();
        $this->createdAt   = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }
    public function getAuteur(): ?User { return $this->auteur; }
    public function setAuteur(?User $auteur): static { $this->auteur = $auteur; return $this; }
    public function getSujet(): ?string { return $this->sujet; }
    public function setSujet(string $sujet): static { $this->sujet = $sujet; return $this; }
    public function getMessage(): ?string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }
    public function getCategorie(): string { return $this->categorie; }
    public function setCategorie(string $categorie): static { $this->categorie = $categorie; return $this; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        if ($statut === self::STATUT_FERME && $this->closedAt === null) {
            $this->closedAt = new \DateTimeImmutable();
        }
        return $this;
    }
    public function getPriorite(): string { return $this->priorite; }
    public function setPriorite(string $priorite): static { $this->priorite = $priorite; return $this; }
    public function getAssigneA(): ?User { return $this->assigneA; }
    public function setAssigneA(?User $assigneA): static { $this->assigneA = $assigneA; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function getClosedAt(): ?\DateTimeImmutable { return $this->closedAt; }
    public function setClosedAt(?\DateTimeImmutable $closedAt): static { $this->closedAt = $closedAt; return $this; }
    public function getLastViewedBySuperAdmin(): ?\DateTimeImmutable { return $this->lastViewedBySuperAdmin; }
    public function setLastViewedBySuperAdmin(?\DateTimeImmutable $v): static { $this->lastViewedBySuperAdmin = $v; return $this; }
    public function getLastViewedByAuthor(): ?\DateTimeImmutable { return $this->lastViewedByAuthor; }
    public function setLastViewedByAuthor(?\DateTimeImmutable $v): static { $this->lastViewedByAuthor = $v; return $this; }
    public function getReplies(): Collection { return $this->replies; }
    public function getAttachments(): Collection { return $this->attachments; }
}

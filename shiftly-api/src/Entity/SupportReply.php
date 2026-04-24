<?php

namespace App\Entity;

use App\Repository\SupportReplyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SupportReplyRepository::class)]
#[ORM\Table(name: 'support_reply')]
class SupportReply
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SupportTicket::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?SupportTicket $ticket = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $auteur = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $message = null;

    /** Si true : note interne superadmin, invisible pour l'auteur du ticket */
    #[ORM\Column]
    private bool $interne = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'reply', targetEntity: SupportAttachment::class, cascade: ['persist', 'remove'])]
    private Collection $attachments;

    public function __construct()
    {
        $this->attachments = new ArrayCollection();
        $this->createdAt   = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getTicket(): ?SupportTicket { return $this->ticket; }
    public function setTicket(?SupportTicket $ticket): static { $this->ticket = $ticket; return $this; }
    public function getAuteur(): ?User { return $this->auteur; }
    public function setAuteur(?User $auteur): static { $this->auteur = $auteur; return $this; }
    public function getMessage(): ?string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }
    public function isInterne(): bool { return $this->interne; }
    public function setInterne(bool $interne): static { $this->interne = $interne; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getAttachments(): Collection { return $this->attachments; }
}

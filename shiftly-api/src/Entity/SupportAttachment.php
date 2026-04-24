<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'support_attachment')]
class SupportAttachment
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SupportTicket::class, inversedBy: 'attachments')]
    #[ORM\JoinColumn(nullable: true)]
    private ?SupportTicket $ticket = null;

    #[ORM\ManyToOne(targetEntity: SupportReply::class, inversedBy: 'attachments')]
    #[ORM\JoinColumn(nullable: true)]
    private ?SupportReply $reply = null;

    #[ORM\Column(length: 255)]
    private ?string $filename = null;

    #[ORM\Column(length: 500)]
    private ?string $storedPath = null;

    #[ORM\Column(length: 100)]
    private ?string $mimeType = null;

    #[ORM\Column]
    private int $size = 0;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $uploadedBy = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getTicket(): ?SupportTicket { return $this->ticket; }
    public function setTicket(?SupportTicket $ticket): static { $this->ticket = $ticket; return $this; }
    public function getReply(): ?SupportReply { return $this->reply; }
    public function setReply(?SupportReply $reply): static { $this->reply = $reply; return $this; }
    public function getFilename(): ?string { return $this->filename; }
    public function setFilename(string $filename): static { $this->filename = $filename; return $this; }
    public function getStoredPath(): ?string { return $this->storedPath; }
    public function setStoredPath(string $storedPath): static { $this->storedPath = $storedPath; return $this; }
    public function getMimeType(): ?string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }
    public function getSize(): int { return $this->size; }
    public function setSize(int $size): static { $this->size = $size; return $this; }
    public function getUploadedBy(): ?User { return $this->uploadedBy; }
    public function setUploadedBy(?User $user): static { $this->uploadedBy = $user; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}

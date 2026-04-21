<?php

namespace App\Entity;

use App\Repository\PlanningSnapshotRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Archivage légal des plannings publiés.
 * Chaque publication crée un snapshot immuable — preuve juridique
 * en cas de litige prud'homal ou de contrôle de l'inspection du travail.
 *
 * Conservation minimum 3 ans (prescription heures supplémentaires).
 * Le checksum SHA-256 garantit l'intégrité du contenu archivé.
 */
#[ORM\Entity(repositoryClass: PlanningSnapshotRepository::class)]
#[ORM\Index(name: 'idx_ps_centre_week', columns: ['centre_id', 'week_start'])]
class PlanningSnapshot
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    /** Lundi de la semaine archivée */
    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $weekStart = null;

    /** Horodatage exact de la publication */
    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $publishedAt = null;

    /** Manager qui a publié */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'published_by', nullable: false)]
    private ?User $publishedBy = null;

    /** Copie intégrale du planning (JSON PlanningWeekData) */
    #[ORM\Column(type: 'json')]
    private array $data = [];

    /** Motif obligatoire si publication hors délai ou republication */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motifModification = null;

    /** SHA-256 du JSON sérialisé — preuve d'intégrité */
    #[ORM\Column(length: 64)]
    private string $checksum = '';

    /** false si publié à moins de 7 jours calendaires (CC IDCC 1790) */
    #[ORM\Column]
    private bool $delaiRespect = true;

    // ── Getters / Setters ──

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }

    public function getWeekStart(): ?\DateTimeImmutable { return $this->weekStart; }
    public function setWeekStart(\DateTimeImmutable $weekStart): static { $this->weekStart = $weekStart; return $this; }

    public function getPublishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }
    public function setPublishedAt(\DateTimeImmutable $publishedAt): static { $this->publishedAt = $publishedAt; return $this; }

    public function getPublishedBy(): ?User { return $this->publishedBy; }
    public function setPublishedBy(?User $publishedBy): static { $this->publishedBy = $publishedBy; return $this; }

    public function getData(): array { return $this->data; }
    public function setData(array $data): static { $this->data = $data; return $this; }

    public function getMotifModification(): ?string { return $this->motifModification; }
    public function setMotifModification(?string $motif): static { $this->motifModification = $motif; return $this; }

    public function getChecksum(): string { return $this->checksum; }
    public function setChecksum(string $checksum): static { $this->checksum = $checksum; return $this; }

    public function isDelaiRespect(): bool { return $this->delaiRespect; }
    public function setDelaiRespect(bool $delaiRespect): static { $this->delaiRespect = $delaiRespect; return $this; }
}

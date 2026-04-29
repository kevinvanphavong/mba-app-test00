<?php

namespace App\Entity;

use App\Repository\PlanningWeekRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * État de publication d'une semaine de planning pour un centre.
 * Une entrée par semaine (weekStart = lundi) par centre.
 */
#[ORM\Entity(repositoryClass: PlanningWeekRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_pw_centre_week', columns: ['centre_id', 'week_start'])]
class PlanningWeek
{
    const STATUT_BROUILLON = 'BROUILLON';
    const STATUT_PUBLIE    = 'PUBLIE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    /** Toujours un lundi */
    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $weekStart = null;

    #[ORM\Column(length: 20)]
    private string $statut = self::STATUT_BROUILLON;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $publishedBy = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $note = null;

    /**
     * Bumpé à chaque mutation (poste, absence) de la semaine via
     * PlanningWeekDirtyListener. Si lastModifiedAt > publishedAt, le live
     * a divergé du dernier snapshot publié → le staff voit une version
     * obsolète tant que le manager n'a pas republié.
     * NULL si jamais modifié après publication (état "Publié, à jour").
     */
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $lastModifiedAt = null;

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }

    public function getWeekStart(): ?\DateTimeImmutable { return $this->weekStart; }
    public function setWeekStart(\DateTimeImmutable $weekStart): static { $this->weekStart = $weekStart; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function isPublie(): bool { return $this->statut === self::STATUT_PUBLIE; }

    public function getPublishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }
    public function setPublishedAt(?\DateTimeImmutable $publishedAt): static { $this->publishedAt = $publishedAt; return $this; }

    public function getPublishedBy(): ?User { return $this->publishedBy; }
    public function setPublishedBy(?User $publishedBy): static { $this->publishedBy = $publishedBy; return $this; }

    public function getNote(): ?string { return $this->note; }
    public function setNote(?string $note): static { $this->note = $note; return $this; }

    public function getLastModifiedAt(): ?\DateTimeImmutable { return $this->lastModifiedAt; }
    public function setLastModifiedAt(?\DateTimeImmutable $dt): static { $this->lastModifiedAt = $dt; return $this; }

    /**
     * Vrai si la semaine a été publiée puis modifiée (le staff voit une
     * version périmée). Retourne false si jamais publiée OU si à jour.
     */
    public function hasUnpublishedChanges(): bool
    {
        if ($this->publishedAt === null || $this->lastModifiedAt === null) {
            return false;
        }
        return $this->lastModifiedAt > $this->publishedAt;
    }
}

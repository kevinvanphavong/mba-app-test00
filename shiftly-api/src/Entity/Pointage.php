<?php

namespace App\Entity;

use App\Repository\PointageRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PointageRepository::class)]
#[ORM\Table(name: 'pointage')]
#[ORM\Index(columns: ['centre_id', 'service_id'], name: 'idx_pointage_centre_service')]
class Pointage
{
    public const STATUT_PREVU    = 'PREVU';
    public const STATUT_EN_COURS = 'EN_COURS';
    public const STATUT_EN_PAUSE = 'EN_PAUSE';
    public const STATUT_TERMINE  = 'TERMINE';
    public const STATUT_ABSENT   = 'ABSENT';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['pointage:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pointage:read'])]
    private ?Service $service = null;

    /** Nullable = pointage sans poste planifié (renfort) */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['pointage:read'])]
    private ?Poste $poste = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pointage:read'])]
    private ?User $user = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['pointage:read'])]
    private ?\DateTimeImmutable $heureArrivee = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['pointage:read'])]
    private ?\DateTimeImmutable $heureDepart = null;

    #[ORM\Column(length: 20)]
    #[Groups(['pointage:read'])]
    private string $statut = self::STATUT_PREVU;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['pointage:read'])]
    private ?string $commentaire = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(mappedBy: 'pointage', targetEntity: PointagePause::class, cascade: ['persist', 'remove'])]
    #[Groups(['pointage:read'])]
    private Collection $pauses;

    public function __construct()
    {
        $this->pauses    = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }

    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $service): static { $this->service = $service; return $this; }

    public function getPoste(): ?Poste { return $this->poste; }
    public function setPoste(?Poste $poste): static { $this->poste = $poste; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getHeureArrivee(): ?\DateTimeImmutable { return $this->heureArrivee; }
    public function setHeureArrivee(?\DateTimeImmutable $h): static { $this->heureArrivee = $h; return $this; }

    public function getHeureDepart(): ?\DateTimeImmutable { return $this->heureDepart; }
    public function setHeureDepart(?\DateTimeImmutable $h): static { $this->heureDepart = $h; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getCommentaire(): ?string { return $this->commentaire; }
    public function setCommentaire(?string $c): static { $this->commentaire = $c; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $u): static { $this->updatedAt = $u; return $this; }

    public function getPauses(): Collection { return $this->pauses; }

    public function addPause(PointagePause $pause): static
    {
        if (!$this->pauses->contains($pause)) {
            $this->pauses->add($pause);
            $pause->setPointage($this);
        }
        return $this;
    }

    public function removePause(PointagePause $pause): static
    {
        $this->pauses->removeElement($pause);
        return $this;
    }
}

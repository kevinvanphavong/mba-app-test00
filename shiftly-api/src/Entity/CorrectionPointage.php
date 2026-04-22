<?php

namespace App\Entity;

use App\Repository\CorrectionPointageRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Trace toutes les corrections manuelles effectuées par un manager sur un pointage.
 */
#[ORM\Entity(repositoryClass: CorrectionPointageRepository::class)]
#[ORM\Table(name: 'correction_pointage')]
class CorrectionPointage
{
    /** Champs modifiables via correction */
    public const CHAMPS = ['heureArrivee', 'heureDepart', 'pauseDebut', 'pauseFin'];

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Pointage::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Pointage $pointage = null;

    /** 'heureArrivee' | 'heureDepart' | 'pauseDebut' | 'pauseFin' */
    #[ORM\Column(length: 50)]
    private string $champModifie = '';

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $ancienneValeur = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $nouvelleValeur = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motif = null;

    /** Manager qui a effectué la correction */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $corrigePar = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getPointage(): ?Pointage { return $this->pointage; }
    public function setPointage(?Pointage $pointage): static { $this->pointage = $pointage; return $this; }

    public function getChampModifie(): string { return $this->champModifie; }
    public function setChampModifie(string $champ): static { $this->champModifie = $champ; return $this; }

    public function getAncienneValeur(): ?\DateTimeImmutable { return $this->ancienneValeur; }
    public function setAncienneValeur(?\DateTimeImmutable $v): static { $this->ancienneValeur = $v; return $this; }

    public function getNouvelleValeur(): ?\DateTimeImmutable { return $this->nouvelleValeur; }
    public function setNouvelleValeur(?\DateTimeImmutable $v): static { $this->nouvelleValeur = $v; return $this; }

    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $motif): static { $this->motif = $motif; return $this; }

    public function getCorrigePar(): ?User { return $this->corrigePar; }
    public function setCorrigePar(?User $user): static { $this->corrigePar = $user; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}

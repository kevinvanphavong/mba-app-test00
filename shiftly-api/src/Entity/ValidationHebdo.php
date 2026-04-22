<?php

namespace App\Entity;

use App\Repository\ValidationHebdoRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Validation hebdomadaire des heures d'un employé pour une semaine donnée.
 * Contrainte unique : un seul enregistrement par (centre, user, semaine).
 */
#[ORM\Entity(repositoryClass: ValidationHebdoRepository::class)]
#[ORM\Table(name: 'validation_hebdo')]
#[ORM\UniqueConstraint(name: 'uniq_validation_centre_user_semaine', columns: ['centre_id', 'user_id', 'semaine'])]
class ValidationHebdo
{
    public const STATUT_EN_ATTENTE = 'EN_ATTENTE';
    public const STATUT_VALIDEE    = 'VALIDEE';
    public const STATUT_CORRIGEE   = 'CORRIGEE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /** Toujours le lundi de la semaine (YYYY-MM-DD) */
    #[ORM\Column(type: 'date_immutable')]
    private ?\DateTimeImmutable $semaine = null;

    #[ORM\Column(length: 20)]
    private string $statut = self::STATUT_EN_ATTENTE;

    /** Heures nettes réelles travaillées (en minutes) */
    #[ORM\Column(type: 'integer')]
    private int $heuresTravaillees = 0;

    /** Heures théoriques prévues (en minutes) */
    #[ORM\Column(type: 'integer')]
    private int $heuresPrevues = 0;

    /** Écart = travaillées - prévues (en minutes, peut être négatif) */
    #[ORM\Column(type: 'integer')]
    private int $ecart = 0;

    /** Heures supplémentaires (en minutes) */
    #[ORM\Column(type: 'integer')]
    private int $heuresSup = 0;

    #[ORM\Column(type: 'integer')]
    private int $nbRetards = 0;

    #[ORM\Column(type: 'integer')]
    private int $nbAbsences = 0;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $commentaire = null;

    /** Manager qui a validé */
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $validePar = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $valideAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getSemaine(): ?\DateTimeImmutable { return $this->semaine; }
    public function setSemaine(\DateTimeImmutable $semaine): static { $this->semaine = $semaine; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getHeuresTravaillees(): int { return $this->heuresTravaillees; }
    public function setHeuresTravaillees(int $minutes): static { $this->heuresTravaillees = $minutes; return $this; }

    public function getHeuresPrevues(): int { return $this->heuresPrevues; }
    public function setHeuresPrevues(int $minutes): static { $this->heuresPrevues = $minutes; return $this; }

    public function getEcart(): int { return $this->ecart; }
    public function setEcart(int $minutes): static { $this->ecart = $minutes; return $this; }

    public function getHeuresSup(): int { return $this->heuresSup; }
    public function setHeuresSup(int $minutes): static { $this->heuresSup = $minutes; return $this; }

    public function getNbRetards(): int { return $this->nbRetards; }
    public function setNbRetards(int $nb): static { $this->nbRetards = $nb; return $this; }

    public function getNbAbsences(): int { return $this->nbAbsences; }
    public function setNbAbsences(int $nb): static { $this->nbAbsences = $nb; return $this; }

    public function getCommentaire(): ?string { return $this->commentaire; }
    public function setCommentaire(?string $c): static { $this->commentaire = $c; return $this; }

    public function getValidePar(): ?User { return $this->validePar; }
    public function setValidePar(?User $user): static { $this->validePar = $user; return $this; }

    public function getValideAt(): ?\DateTimeImmutable { return $this->valideAt; }
    public function setValideAt(?\DateTimeImmutable $dt): static { $this->valideAt = $dt; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(?\DateTimeImmutable $dt): static { $this->updatedAt = $dt; return $this; }
}

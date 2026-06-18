<?php

namespace App\Entity;

use App\Repository\ContratRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Contrat d'un salarié (E3) — historise les contrats successifs (CDI, CDD,
 * EXTRA…) avec dates de début/fin. Le contrat « actif » a dateFin = null.
 *
 * Additif : les champs typeContrat/dateEmbauche/heuresHebdo restent sur User
 * comme miroir du contrat actif (consommés par le moteur de planning). Cette
 * entité ne fait qu'ajouter l'historique.
 */
#[ORM\Entity(repositoryClass: ContratRepository::class)]
class Contrat
{
    public const TYPES = ['CDI', 'CDD', 'EXTRA', 'ALTERNANCE', 'STAGE', 'INTERIM'];

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'contrats')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 30)]
    #[Assert\Choice(choices: self::TYPES, message: 'Type de contrat invalide.')]
    private string $typeContrat = 'CDI';

    #[ORM\Column(type: 'date_immutable')]
    #[Assert\NotNull(message: 'La date de début est requise.')]
    private ?\DateTimeImmutable $dateDebut = null;

    /** null = contrat en cours. */
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $dateFin = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $qualification = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Range(min: 0, max: 60, notInRangeMessage: 'Heures hebdo hors plage.')]
    private ?int $heuresHebdo = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getTypeContrat(): string
    {
        return $this->typeContrat;
    }

    public function setTypeContrat(string $typeContrat): static
    {
        $this->typeContrat = $typeContrat;

        return $this;
    }

    public function getDateDebut(): ?\DateTimeImmutable
    {
        return $this->dateDebut;
    }

    public function setDateDebut(?\DateTimeImmutable $dateDebut): static
    {
        $this->dateDebut = $dateDebut;

        return $this;
    }

    public function getDateFin(): ?\DateTimeImmutable
    {
        return $this->dateFin;
    }

    public function setDateFin(?\DateTimeImmutable $dateFin): static
    {
        $this->dateFin = $dateFin;

        return $this;
    }

    public function getQualification(): ?string
    {
        return $this->qualification;
    }

    public function setQualification(?string $qualification): static
    {
        $this->qualification = $qualification;

        return $this;
    }

    public function getHeuresHebdo(): ?int
    {
        return $this->heuresHebdo;
    }

    public function setHeuresHebdo(?int $heuresHebdo): static
    {
        $this->heuresHebdo = $heuresHebdo;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}

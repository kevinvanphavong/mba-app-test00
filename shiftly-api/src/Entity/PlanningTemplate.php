<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PlanningTemplateRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * Modèle de planning hebdomadaire réutilisable.
 *
 * Un template est scopé à un Centre (multi-tenancy strict). Il contient des
 * shifts indexés par jour de la semaine (0 = lundi … 6 = dimanche). Au moment
 * de l'application sur une semaine cible, chaque shift devient un Poste sur
 * le Service correspondant.
 *
 * Les endpoints sont exposés via PlanningTemplateController (controllers
 * custom — pas via API Platform).
 */
#[ORM\Entity(repositoryClass: PlanningTemplateRepository::class)]
#[ORM\Table(name: 'planning_template')]
#[ORM\UniqueConstraint(name: 'uniq_planning_template_centre_nom', columns: ['centre_id', 'nom'])]
class PlanningTemplate
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Centre $centre = null;

    #[ORM\Column(length: 100)]
    private string $nom;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $createdBy = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\OneToMany(mappedBy: 'template', targetEntity: PlanningTemplateShift::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $shifts;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->shifts    = new ArrayCollection();
        $this->nom       = '';
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $u): static { $this->createdBy = $u; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    /** @return Collection<int, PlanningTemplateShift> */
    public function getShifts(): Collection { return $this->shifts; }

    public function addShift(PlanningTemplateShift $shift): static
    {
        if (!$this->shifts->contains($shift)) {
            $this->shifts->add($shift);
            $shift->setTemplate($this);
        }
        return $this;
    }

    public function removeShift(PlanningTemplateShift $shift): static
    {
        $this->shifts->removeElement($shift);
        return $this;
    }
}

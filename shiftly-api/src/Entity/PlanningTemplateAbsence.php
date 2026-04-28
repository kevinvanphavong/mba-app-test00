<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Absence d'un PlanningTemplate.
 *
 * Représente un jour d'absence (REPOS, CP, RTT, MALADIE, EVENEMENT_FAMILLE,
 * AUTRE) figé dans un modèle hebdomadaire. À l'application du template sur
 * une semaine cible, chaque entrée devient une Absence réelle pour le user
 * sur le jour calculé (lundi cible + dayOfWeek).
 *
 * user nullable : si l'employé est supprimé après création du template,
 * l'entrée devient orpheline (ON DELETE SET NULL) et sera ignorée à
 * l'application — le template survit au turnover, comme pour les shifts.
 */
#[ORM\Entity]
#[ORM\Table(name: 'planning_template_absence')]
class PlanningTemplateAbsence
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: PlanningTemplate::class, inversedBy: 'absences')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?PlanningTemplate $template = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    /** Jour de la semaine : 0 = lundi, 6 = dimanche */
    #[ORM\Column(type: 'smallint')]
    private int $dayOfWeek = 0;

    /** Type d'absence : CP | RTT | MALADIE | REPOS | EVENEMENT_FAMILLE | AUTRE */
    #[ORM\Column(length: 30)]
    private string $type = 'REPOS';

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $motif = null;

    public function getId(): ?int { return $this->id; }
    public function getTemplate(): ?PlanningTemplate { return $this->template; }
    public function setTemplate(?PlanningTemplate $t): static { $this->template = $t; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }
    public function getDayOfWeek(): int { return $this->dayOfWeek; }
    public function setDayOfWeek(int $d): static { $this->dayOfWeek = $d; return $this; }
    public function getType(): string { return $this->type; }
    public function setType(string $t): static { $this->type = $t; return $this; }
    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $m): static { $this->motif = $m; return $this; }
}

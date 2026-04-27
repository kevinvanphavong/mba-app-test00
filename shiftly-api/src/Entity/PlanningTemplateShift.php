<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Shift d'un PlanningTemplate.
 *
 * Représente une assignation prévisionnelle (zone + user + horaires) pour un
 * jour de semaine donné. user nullable : si le user est supprimé après création
 * du template, le shift devient orphelin (ON DELETE SET NULL) et sera ignoré
 * lors de l'application du template — le template survit au turnover.
 */
#[ORM\Entity]
#[ORM\Table(name: 'planning_template_shift')]
class PlanningTemplateShift
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: PlanningTemplate::class, inversedBy: 'shifts')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?PlanningTemplate $template = null;

    #[ORM\ManyToOne(targetEntity: Zone::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Zone $zone = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    /** Jour de la semaine : 0 = lundi, 6 = dimanche */
    #[ORM\Column(type: 'smallint')]
    private int $dayOfWeek = 0;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeImmutable $heureDebut = null;

    #[ORM\Column(type: 'time_immutable', nullable: true)]
    private ?\DateTimeImmutable $heureFin = null;

    #[ORM\Column(options: ['default' => 0])]
    private int $pauseMinutes = 0;

    public function getId(): ?int { return $this->id; }
    public function getTemplate(): ?PlanningTemplate { return $this->template; }
    public function setTemplate(?PlanningTemplate $t): static { $this->template = $t; return $this; }
    public function getZone(): ?Zone { return $this->zone; }
    public function setZone(?Zone $z): static { $this->zone = $z; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): static { $this->user = $u; return $this; }
    public function getDayOfWeek(): int { return $this->dayOfWeek; }
    public function setDayOfWeek(int $d): static { $this->dayOfWeek = $d; return $this; }
    public function getHeureDebut(): ?\DateTimeImmutable { return $this->heureDebut; }
    public function setHeureDebut(?\DateTimeImmutable $h): static { $this->heureDebut = $h; return $this; }
    public function getHeureFin(): ?\DateTimeImmutable { return $this->heureFin; }
    public function setHeureFin(?\DateTimeImmutable $h): static { $this->heureFin = $h; return $this; }
    public function getPauseMinutes(): int { return $this->pauseMinutes; }
    public function setPauseMinutes(int $m): static { $this->pauseMinutes = $m; return $this; }
}

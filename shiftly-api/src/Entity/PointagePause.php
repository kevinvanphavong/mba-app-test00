<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'pointage_pause')]
class PointagePause
{
    public const TYPE_COURTE = 'COURTE';
    public const TYPE_REPAS  = 'REPAS';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['pointage:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'pauses')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Pointage $pointage = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['pointage:read'])]
    private ?\DateTimeImmutable $heureDebut = null;

    /** null = pause en cours */
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['pointage:read'])]
    private ?\DateTimeImmutable $heureFin = null;

    #[ORM\Column(length: 20)]
    #[Groups(['pointage:read'])]
    private string $type = self::TYPE_COURTE;

    public function getId(): ?int { return $this->id; }

    public function getPointage(): ?Pointage { return $this->pointage; }
    public function setPointage(?Pointage $pointage): static { $this->pointage = $pointage; return $this; }

    public function getHeureDebut(): ?\DateTimeImmutable { return $this->heureDebut; }
    public function setHeureDebut(\DateTimeImmutable $h): static { $this->heureDebut = $h; return $this; }

    public function getHeureFin(): ?\DateTimeImmutable { return $this->heureFin; }
    public function setHeureFin(?\DateTimeImmutable $h): static { $this->heureFin = $h; return $this; }

    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }
}

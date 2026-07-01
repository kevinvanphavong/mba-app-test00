<?php

namespace App\Entity;

use App\Repository\IaQuotaRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Compteur de consommation IA d'un centre, agrégé sur un mois (période AAAA-MM).
 * Une ligne par (centre, période) — c'est le coupe-circuit du quota : l'incrément
 * est fait de façon ATOMIQUE et conditionnelle au plafond (cf. IaQuotaRepository),
 * donc le plafond ne peut pas être dépassé même en cas d'appels concurrents.
 *
 * Isolation tenant : `centre` non nul. Non exposée via API Platform (usage interne
 * au service Core\Ia).
 */
#[ORM\Entity(repositoryClass: IaQuotaRepository::class)]
#[ORM\Table(name: 'ia_quota')]
#[ORM\UniqueConstraint(name: 'uniq_ia_quota_centre_periode', columns: ['centre_id', 'periode'])]
class IaQuota
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    /** Mois de consommation au format « AAAA-MM ». */
    #[ORM\Column(length: 7)]
    private string $periode = '';

    /** Nombre d'appels IA émis sur la période (source du quota). */
    #[ORM\Column(options: ['default' => 0])]
    private int $appels = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCentre(): ?Centre
    {
        return $this->centre;
    }

    public function getPeriode(): string
    {
        return $this->periode;
    }

    public function getAppels(): int
    {
        return $this->appels;
    }
}

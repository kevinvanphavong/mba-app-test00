<?php

namespace App\Entity;

use App\Repository\PlateformeIaQuotaRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Compteur de consommation IA de la PLATEFORME (super-admin), agrégé par mois.
 * Budget DISTINCT du quota par-centre : le résumé IA de la console agence est un
 * outil du super-admin, il ne doit jamais entamer le quota d'un client.
 *
 * Une ligne par période (AAAA-MM), incrément atomique conditionnel au plafond
 * (cf. PlateformeIaQuotaRepository) — non exposée via API Platform.
 */
#[ORM\Entity(repositoryClass: PlateformeIaQuotaRepository::class)]
#[ORM\Table(name: 'plateforme_ia_quota')]
#[ORM\UniqueConstraint(name: 'uniq_plateforme_ia_quota_periode', columns: ['periode'])]
class PlateformeIaQuota
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 7)]
    private string $periode = '';

    #[ORM\Column(options: ['default' => 0])]
    private int $appels = 0;

    public function getId(): ?int
    {
        return $this->id;
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

<?php

namespace App\Repository;

use App\Entity\PlateformeIaQuota;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlateformeIaQuota>
 */
class PlateformeIaQuotaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlateformeIaQuota::class);
    }

    /**
     * Réserve un appel IA plateforme pour la période, sous le plafond, de façon
     * atomique (UPDATE conditionnel, race-safe). Retourne false si plafond atteint.
     */
    public function reserve(string $periode, int $plafond): bool
    {
        $conn = $this->getEntityManager()->getConnection();

        $conn->executeStatement(
            'INSERT INTO plateforme_ia_quota (periode, appels) VALUES (:p, 0)
             ON CONFLICT (periode) DO NOTHING',
            ['p' => $periode],
        );

        return 1 === $conn->executeStatement(
            'UPDATE plateforme_ia_quota SET appels = appels + 1
             WHERE periode = :p AND appels < :plafond',
            ['p' => $periode, 'plafond' => $plafond],
        );
    }

    public function release(string $periode): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'UPDATE plateforme_ia_quota SET appels = appels - 1 WHERE periode = :p AND appels > 0',
            ['p' => $periode],
        );
    }

    public function appelsPour(string $periode): int
    {
        return $this->findOneBy(['periode' => $periode])?->getAppels() ?? 0;
    }
}

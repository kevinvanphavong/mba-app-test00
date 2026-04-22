<?php

namespace App\Repository;

use App\Entity\CorrectionPointage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CorrectionPointage>
 */
class CorrectionPointageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CorrectionPointage::class);
    }

    /**
     * Retourne les corrections d'un pointage, triées du plus récent au plus ancien.
     *
     * @return CorrectionPointage[]
     */
    public function findByPointage(int $pointageId): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.pointage = :pointageId')
            ->setParameter('pointageId', $pointageId)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne toutes les corrections des pointages d'un service donné.
     *
     * @return CorrectionPointage[]
     */
    public function findByServiceAndCentre(int $serviceId, int $centreId): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.pointage', 'p')
            ->andWhere('p.service = :serviceId')
            ->andWhere('p.centre = :centreId')
            ->setParameter('serviceId', $serviceId)
            ->setParameter('centreId', $centreId)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}

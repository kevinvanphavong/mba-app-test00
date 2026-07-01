<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\IaUsage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<IaUsage>
 */
class IaUsageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, IaUsage::class);
    }

    /**
     * Nombre de consos journalisées pour un centre sur un mois (AAAA-MM).
     * Filtre explicite par centre → isolation tenant (aucune conso croisée).
     * Borné par plage de dates (DQL standard, pas de fonction SQL propriétaire).
     */
    public function countForCentreAndMonth(Centre $centre, string $periode): int
    {
        $debut = new \DateTimeImmutable($periode.'-01 00:00:00');

        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->andWhere('u.centre = :centre')
            ->andWhere('u.createdAt >= :debut')
            ->andWhere('u.createdAt < :fin')
            ->setParameter('centre', $centre)
            ->setParameter('debut', $debut)
            ->setParameter('fin', $debut->modify('+1 month'))
            ->getQuery()
            ->getSingleScalarResult();
    }
}

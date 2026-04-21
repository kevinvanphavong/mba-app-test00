<?php

namespace App\Repository;

use App\Entity\PlanningSnapshot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class PlanningSnapshotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanningSnapshot::class);
    }

    /**
     * Historique des snapshots pour une semaine donnée, du plus récent au plus ancien.
     */
    public function findByWeek(int $centreId, \DateTimeImmutable $weekStart): array
    {
        return $this->createQueryBuilder('ps')
            ->andWhere('ps.centre = :centreId')
            ->andWhere('ps.weekStart = :weekStart')
            ->setParameter('centreId', $centreId)
            ->setParameter('weekStart', $weekStart, Types::DATE_IMMUTABLE)
            ->orderBy('ps.publishedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Dernier snapshot d'une semaine (utile pour vérifier si c'est une republication).
     */
    public function findLatestByWeek(int $centreId, \DateTimeImmutable $weekStart): ?PlanningSnapshot
    {
        return $this->createQueryBuilder('ps')
            ->andWhere('ps.centre = :centreId')
            ->andWhere('ps.weekStart = :weekStart')
            ->setParameter('centreId', $centreId)
            ->setParameter('weekStart', $weekStart, Types::DATE_IMMUTABLE)
            ->orderBy('ps.publishedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}

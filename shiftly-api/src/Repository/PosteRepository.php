<?php

namespace App\Repository;

use App\Entity\Poste;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class PosteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Poste::class);
    }

    /**
     * Retourne les IDs des utilisateurs ayant au moins un poste planifié
     * sur la plage [from, to] dans le centre donné (basé sur service.date).
     *
     * @return int[]
     */
    public function findPlanifiedUserIds(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('DISTINCT IDENTITY(p.user) AS uid')
            ->join('p.service', 's')
            ->andWhere('s.centre = :centreId')
            ->andWhere('s.date BETWEEN :from AND :to')
            ->andWhere('p.user IS NOT NULL')
            ->setParameter('centreId', $centreId)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getScalarResult();

        return array_map(static fn(array $r) => (int) $r['uid'], $rows);
    }
}

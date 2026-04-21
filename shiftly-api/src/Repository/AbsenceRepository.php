<?php

namespace App\Repository;

use App\Entity\Absence;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class AbsenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Absence::class);
    }

    /**
     * Retourne toutes les absences d'un centre sur une plage de dates.
     */
    public function findByCentreAndDateRange(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('a')
            ->join('a.user', 'u')
            ->andWhere('a.centre = :centreId')
            ->andWhere('a.date BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getResult();
    }
}

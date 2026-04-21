<?php

namespace App\Repository;

use App\Entity\PlanningWeek;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class PlanningWeekRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanningWeek::class);
    }

    /** Trouve la PlanningWeek pour un centre et un lundi donné */
    public function findByCentreAndWeek(int $centreId, \DateTimeImmutable $weekStart): ?PlanningWeek
    {
        return $this->createQueryBuilder('pw')
            ->andWhere('pw.centre = :centreId')
            ->andWhere('pw.weekStart = :weekStart')
            ->setParameter('centreId', $centreId)
            ->setParameter('weekStart', $weekStart, Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** Semaines publiées entre deux lundis (pour la vue employé) */
    public function findPublishedBetween(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('pw')
            ->andWhere('pw.centre = :centreId')
            ->andWhere('pw.statut = :statut')
            ->andWhere('pw.weekStart BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('statut', PlanningWeek::STATUT_PUBLIE)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->orderBy('pw.weekStart', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

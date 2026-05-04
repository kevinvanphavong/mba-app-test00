<?php

namespace App\Repository;

use App\Entity\Service;
use App\Service\ActiveDayResolver;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class ServiceRepository extends ServiceEntityRepository
{
    public function __construct(
        ManagerRegistry $registry,
        private readonly ActiveDayResolver $activeDayResolver,
    ) {
        parent::__construct($registry, Service::class);
    }

    public function findTodayActive(int $centreId): ?Service
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->andWhere('s.date = :date')
            ->setParameter('centreId', $centreId)
            ->setParameter('date', $this->activeDayResolver->getActiveDate(), Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findRecent(int $centreId, int $limit = 10): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('s.date', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()->getResult();
    }

    /** Tous les services d'un centre, triés par date décroissante */
    public function findByCentreDesc(int $centreId): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('s.date', 'DESC')
            ->getQuery()->getResult();
    }

    public function findBetween(int $centreId, \DateTimeInterface $from, \DateTimeInterface $to): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->andWhere('s.date BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->orderBy('s.date', 'ASC')
            ->getQuery()->getResult();
    }
}

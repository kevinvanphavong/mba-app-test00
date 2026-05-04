<?php

namespace App\Repository;

use App\Entity\Service;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class ServiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Service::class);
    }

    public function findToday(int $centreId): ?Service
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->andWhere('s.date = :today')
            ->setParameter('centreId', $centreId)
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->getQuery()->getOneOrNullResult();
    }


    public function findTodayActive(int $centreId): ?Service
    {
        $now = new \DateTimeImmutable();

        // Avant 5h → on est encore dans la journée d'hier (service de nuit)
        $referenceDate = (int)$now->format('H') < 5
            ? $now->modify('-1 day')
            : $now;

        // JOIN sur centre pour charger les horaires en une seule requête
        $service = $this->createQueryBuilder('s')
            ->andWhere('s.centre = :centreId')
            ->andWhere('s.date = :date')
            ->setParameter('centreId', $centreId)
            ->setParameter('date', $referenceDate, Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getOneOrNullResult();

        return $service ? $service : null;
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

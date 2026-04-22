<?php

namespace App\Repository;

use App\Entity\Pointage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

class PointageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pointage::class);
    }

    /**
     * Retourne tous les pointages d'un centre sur une plage de dates (basé sur service.date).
     *
     * @return Pointage[]
     */
    public function findByCentreAndDateRange(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.service', 's')
            ->leftJoin('p.user', 'u')
            ->leftJoin('p.poste', 'po')
            ->leftJoin('po.zone', 'z')
            ->leftJoin('p.pauses', 'pp')
            ->addSelect('s', 'u', 'po', 'z', 'pp')
            ->andWhere('p.centre = :centreId')
            ->andWhere('s.date BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->orderBy('u.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /** Retourne tous les pointages d'un service, avec user, poste, zone et pauses en une requête. */
    public function findByService(int $serviceId): array
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.user', 'u')
            ->leftJoin('p.poste', 'po')
            ->leftJoin('po.zone', 'z')
            ->leftJoin('p.pauses', 'pp')
            ->addSelect('u', 'po', 'z', 'pp')
            ->andWhere('p.service = :serviceId')
            ->setParameter('serviceId', $serviceId)
            ->orderBy('u.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /** Vérifie si un service a déjà au moins un pointage. */
    public function hasPointagesForService(int $serviceId): bool
    {
        return (int) $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->andWhere('p.service = :serviceId')
            ->setParameter('serviceId', $serviceId)
            ->getQuery()
            ->getSingleScalarResult() > 0;
    }
}

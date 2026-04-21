<?php

namespace App\Repository;

use App\Entity\Pointage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PointageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pointage::class);
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

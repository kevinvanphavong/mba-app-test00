<?php

namespace App\Repository;

use App\Entity\Mission;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MissionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Mission::class);
    }

    public function findByZone(int $zoneId): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.zone = :zoneId')->setParameter('zoneId', $zoneId)
            ->orderBy('m.ordre', 'ASC')
            ->getQuery()->getResult();
    }

    public function findByZoneAndCategorie(int $zoneId, string $categorie): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.zone = :zoneId')->setParameter('zoneId', $zoneId)
            ->andWhere('m.categorie = :categorie')->setParameter('categorie', $categorie)
            ->orderBy('m.ordre', 'ASC')
            ->getQuery()->getResult();
    }

    /**
     * Missions d'un poste dans un service :
     * - Toutes les missions FIXES de la zone
     * - Toutes les missions PONCTUELLES liées à cette zone ET ce service
     */
    public function findForService(int $zoneId, int $serviceId): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.zone = :zoneId')
            ->andWhere(
                '(m.frequence = :fixe) OR (m.frequence = :ponct AND m.service = :serviceId)'
            )
            ->setParameter('zoneId', $zoneId)
            ->setParameter('fixe', 'FIXE')
            ->setParameter('ponct', 'PONCTUELLE')
            ->setParameter('serviceId', $serviceId)
            ->orderBy('m.ordre', 'ASC')
            ->addOrderBy('m.id', 'ASC')
            ->getQuery()->getResult();
    }
}

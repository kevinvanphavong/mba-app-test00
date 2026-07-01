<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\DemandeB2B;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DemandeB2B>
 */
class DemandeB2BRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DemandeB2B::class);
    }

    /**
     * Demande d'un centre donné par son id — ou null (verrou cross-tenant pour les
     * routes custom, ex. relance de génération de devis par le gérant).
     */
    public function findOneForCentre(int $id, Centre $centre): ?DemandeB2B
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.id = :id')
            ->andWhere('d.centre = :centre')
            ->setParameter('id', $id)
            ->setParameter('centre', $centre)
            ->getQuery()
            ->getOneOrNullResult();
    }
}

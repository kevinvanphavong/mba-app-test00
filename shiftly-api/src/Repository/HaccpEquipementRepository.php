<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\HaccpEquipement;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HaccpEquipementRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HaccpEquipement::class);
    }

    /** @return HaccpEquipement[] */
    public function findActifsByCentre(Centre $centre): array
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.centre = :c')
            ->andWhere('e.actif = true')
            ->orderBy('e.ordre', 'ASC')
            ->addOrderBy('e.nom', 'ASC')
            ->setParameter('c', $centre)
            ->getQuery()
            ->getResult();
    }
}

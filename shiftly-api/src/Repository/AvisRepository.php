<?php

namespace App\Repository;

use App\Entity\Avis;
use App\Entity\Centre;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Avis>
 */
class AvisRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Avis::class);
    }

    /** Avis d'un centre par id — ou null (verrou cross-tenant pour routes custom). */
    public function findOneForCentre(int $id, Centre $centre): ?Avis
    {
        return $this->findOneBy(['id' => $id, 'centre' => $centre]);
    }
}

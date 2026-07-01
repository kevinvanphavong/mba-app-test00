<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\Relance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Relance>
 */
class RelanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Relance::class);
    }

    /** Relance d'un centre par id — ou null (verrou cross-tenant pour routes custom). */
    public function findOneForCentre(int $id, Centre $centre): ?Relance
    {
        return $this->findOneBy(['id' => $id, 'centre' => $centre]);
    }
}

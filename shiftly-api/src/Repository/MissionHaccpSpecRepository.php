<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\HaccpEquipement;
use App\Entity\MissionHaccpSpec;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MissionHaccpSpecRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MissionHaccpSpec::class);
    }

    /**
     * Specs T° (équipement + moment renseignés) pour un équipement donné.
     * Utilisé par le générateur pour vérifier l'idempotence.
     *
     * @return MissionHaccpSpec[]
     */
    public function findTemperatureSpecsForEquipement(HaccpEquipement $equipement): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.equipement = :e')
            ->andWhere('s.typeReleve = :t')
            ->setParameter('e', $equipement)
            ->setParameter('t', MissionHaccpSpec::TYPE_TEMPERATURE)
            ->getQuery()
            ->getResult();
    }

    /** @return MissionHaccpSpec[] */
    public function findByCentre(Centre $centre): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.centre = :c')
            ->setParameter('c', $centre)
            ->getQuery()
            ->getResult();
    }
}

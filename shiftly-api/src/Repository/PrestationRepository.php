<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\Prestation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Prestation>
 */
class PrestationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Prestation::class);
    }

    /**
     * Prestations publiquement affichables d'un centre donné, dans l'ordre voulu.
     *
     * Le filtre par centre est explicite (`centre = :centre`) : la lecture publique
     * ne dépend jamais d'un paramètre client, seulement du centre déjà résolu par le
     * host. Aucune fuite cross-tenant possible — on ne sert que les prestations
     * actives de CE centre.
     *
     * @return list<Prestation>
     */
    public function findPubliquesForCentre(Centre $centre): array
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.centre = :centre')
            ->andWhere('p.actif = true')
            ->setParameter('centre', $centre)
            ->orderBy('p.ordre', 'ASC')
            ->addOrderBy('p.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

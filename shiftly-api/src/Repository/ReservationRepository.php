<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\Reservation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Reservation>
 */
class ReservationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reservation::class);
    }

    /**
     * Réservation d'un centre donné par son id — ou null (verrou cross-tenant).
     *
     * Le filtre `centre = :centre` est explicite : la création de session de
     * paiement publique passe par le centre résolu par host, donc une résa d'un
     * AUTRE centre (id deviné) est introuvable → 404, jamais de paiement croisé.
     */
    public function findOneForCentre(int $id, Centre $centre): ?Reservation
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.id = :id')
            ->andWhere('r.centre = :centre')
            ->setParameter('id', $id)
            ->setParameter('centre', $centre)
            ->getQuery()
            ->getOneOrNullResult();
    }
}

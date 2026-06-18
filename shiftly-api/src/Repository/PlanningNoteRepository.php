<?php

namespace App\Repository;

use App\Entity\PlanningNote;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlanningNote>
 */
class PlanningNoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanningNote::class);
    }

    /**
     * Notes d'un centre sur une plage de dates, triées par date puis création.
     *
     * @return PlanningNote[]
     */
    public function findByCentreAndDateRange(int $centreId, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('n')
            ->andWhere('n.centre = :centreId')
            ->andWhere('n.date BETWEEN :from AND :to')
            ->setParameter('centreId', $centreId)
            ->setParameter('from', $from, Types::DATE_IMMUTABLE)
            ->setParameter('to', $to, Types::DATE_IMMUTABLE)
            ->orderBy('n.date', 'ASC')
            ->addOrderBy('n.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

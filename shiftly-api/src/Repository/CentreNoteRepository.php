<?php

namespace App\Repository;

use App\Entity\CentreNote;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CentreNoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CentreNote::class);
    }

    public function findByCentre(int $centreId): array
    {
        return $this->createQueryBuilder('n')
            ->andWhere('n.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()->getResult();
    }
}

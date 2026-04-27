<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PlanningTemplate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PlanningTemplateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlanningTemplate::class);
    }

    /** @return PlanningTemplate[] */
    public function findByCentre(int $centreId): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}

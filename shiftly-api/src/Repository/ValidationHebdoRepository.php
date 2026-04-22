<?php

namespace App\Repository;

use App\Entity\ValidationHebdo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ValidationHebdo>
 */
class ValidationHebdoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ValidationHebdo::class);
    }

    /**
     * Retourne toutes les validations d'un centre pour une semaine donnée.
     *
     * @return ValidationHebdo[]
     */
    public function findByCentreAndSemaine(int $centreId, \DateTimeImmutable $lundi): array
    {
        return $this->createQueryBuilder('v')
            ->andWhere('v.centre = :centreId')
            ->andWhere('v.semaine = :semaine')
            ->setParameter('centreId', $centreId)
            ->setParameter('semaine', $lundi->format('Y-m-d'))
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne la validation d'un employé pour une semaine donnée.
     */
    public function findOneByUserAndSemaine(int $centreId, int $userId, \DateTimeImmutable $lundi): ?ValidationHebdo
    {
        return $this->createQueryBuilder('v')
            ->andWhere('v.centre = :centreId')
            ->andWhere('v.user = :userId')
            ->andWhere('v.semaine = :semaine')
            ->setParameter('centreId', $centreId)
            ->setParameter('userId', $userId)
            ->setParameter('semaine', $lundi->format('Y-m-d'))
            ->getQuery()
            ->getOneOrNullResult();
    }
}

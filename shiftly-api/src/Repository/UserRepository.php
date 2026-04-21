<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findActifByCentre(int $centreId): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.centre = :centreId')
            ->andWhere('u.actif = true')
            ->setParameter('centreId', $centreId)
            ->orderBy('u.nom', 'ASC')
            ->getQuery()->getResult();
    }

    public function findByCentre(int $centreId): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('u.nom', 'ASC')
            ->getQuery()->getResult();
    }

    public function countActifByCentre(int $centreId): int
    {
        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->andWhere('u.centre = :centreId')
            ->andWhere('u.actif = true')
            ->setParameter('centreId', $centreId)
            ->getQuery()->getSingleScalarResult();
    }

    public function findLeaderboard(int $centreId): array
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.centre = :centreId')
            ->setParameter('centreId', $centreId)
            ->orderBy('u.points', 'DESC')
            ->getQuery()->getResult();
    }
}

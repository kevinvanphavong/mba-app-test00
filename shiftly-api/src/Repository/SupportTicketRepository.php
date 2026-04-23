<?php

namespace App\Repository;

use App\Entity\SupportTicket;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SupportTicketRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SupportTicket::class);
    }

    public function findFilteredForSuperAdmin(array $filters): array
    {
        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.centre', 'c')->addSelect('c')
            ->leftJoin('t.auteur', 'a')->addSelect('a')
            ->leftJoin('t.assigneA', 'ass')->addSelect('ass')
            ->orderBy('t.createdAt', 'DESC');

        if (!empty($filters['statut'])) {
            $qb->andWhere('t.statut = :statut')->setParameter('statut', $filters['statut']);
        }
        if (!empty($filters['priorite'])) {
            $qb->andWhere('t.priorite = :priorite')->setParameter('priorite', $filters['priorite']);
        }
        if (!empty($filters['categorie'])) {
            $qb->andWhere('t.categorie = :categorie')->setParameter('categorie', $filters['categorie']);
        }
        if (!empty($filters['centre'])) {
            $qb->andWhere('c.id = :centreId')->setParameter('centreId', $filters['centre']);
        }
        if (!empty($filters['search'])) {
            $qb->andWhere('t.sujet LIKE :search OR t.message LIKE :search')
               ->setParameter('search', "%{$filters['search']}%");
        }

        return $qb->getQuery()->getResult();
    }

    public function findByAuteur(User $auteur): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.auteur = :auteur')
            ->setParameter('auteur', $auteur)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()->getResult();
    }

    public function countOuverts(): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.statut = :statut')
            ->setParameter('statut', SupportTicket::STATUT_OUVERT)
            ->getQuery()->getSingleScalarResult();
    }

    public function countByStatut(string $statut): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.statut = :statut')
            ->setParameter('statut', $statut)
            ->getQuery()->getSingleScalarResult();
    }

    public function countUrgents(): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.priorite = :p AND t.statut != :ferme')
            ->setParameter('p', SupportTicket::PRIORITE_URGENTE)
            ->setParameter('ferme', SupportTicket::STATUT_FERME)
            ->getQuery()->getSingleScalarResult();
    }

    public function countResolusCetteSemaine(): int
    {
        $weekStart = new \DateTimeImmutable('monday this week');
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.statut = :r')
            ->andWhere('t.updatedAt >= :start')
            ->setParameter('r', SupportTicket::STATUT_RESOLU)
            ->setParameter('start', $weekStart)
            ->getQuery()->getSingleScalarResult();
    }
}

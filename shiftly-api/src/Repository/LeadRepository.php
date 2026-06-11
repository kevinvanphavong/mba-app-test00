<?php

namespace App\Repository;

use App\Entity\Lead;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LeadRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lead::class);
    }

    /**
     * Liste filtrée pour le back-office /superadmin/leads.
     * Tri : status=nouveau d'abord, puis createdAt DESC.
     *
     * @return array{items: Lead[], total: int}
     */
    public function findFilteredForSuperAdmin(array $filters, int $page = 1, int $perPage = 30): array
    {
        $qb = $this->createQueryBuilder('l')
            ->leftJoin('l.handledBy', 'h')->addSelect('h');

        if (!empty($filters['status'])) {
            $qb->andWhere('l.status = :status')->setParameter('status', $filters['status']);
        }
        if (!empty($filters['intent'])) {
            $qb->andWhere('l.intent = :intent')->setParameter('intent', $filters['intent']);
        }
        if (!empty($filters['plan'])) {
            $qb->andWhere('l.plan = :plan')->setParameter('plan', $filters['plan']);
        }
        if (!empty($filters['q'])) {
            $qb->andWhere('l.name LIKE :q OR l.email LIKE :q OR l.centre LIKE :q')
               ->setParameter('q', "%{$filters['q']}%");
        }

        // Count AVANT d'ajouter le ORDER BY CASE — sinon le paramètre :st_nouveau
        // reste bound sur le clone alors qu'aucune clause ne le consomme,
        // ce qui fait planter Doctrine ("Too many parameters: ... bound 1").
        $total = (int) (clone $qb)
            ->select('COUNT(l.id)')
            ->getQuery()
            ->getSingleScalarResult();

        // priorise "nouveau" en haut puis tri date desc
        $qb->orderBy('CASE WHEN l.status = :st_nouveau THEN 0 ELSE 1 END', 'ASC')
           ->addOrderBy('l.createdAt', 'DESC')
           ->setParameter('st_nouveau', Lead::STATUS_NOUVEAU);

        $items = $qb
            ->setFirstResult(max(0, ($page - 1) * $perPage))
            ->setMaxResults($perPage)
            ->getQuery()
            ->getResult();

        return ['items' => $items, 'total' => $total];
    }

    public function countByStatus(string $status): int
    {
        return (int) $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->andWhere('l.status = :s')
            ->setParameter('s', $status)
            ->getQuery()->getSingleScalarResult();
    }

    public function countCreatedSince(\DateTimeImmutable $since): int
    {
        return (int) $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->andWhere('l.createdAt >= :since')
            ->setParameter('since', $since)
            ->getQuery()->getSingleScalarResult();
    }

    public function countUnhandledOlderThan(\DateTimeImmutable $before): int
    {
        return (int) $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->andWhere('l.status = :s')
            ->andWhere('l.createdAt < :before')
            ->setParameter('s', Lead::STATUS_NOUVEAU)
            ->setParameter('before', $before)
            ->getQuery()->getSingleScalarResult();
    }

    /** Compte les leads créés avec le même email dans les dernières $hours heures. */
    public function countRecentByEmail(string $email, int $hours = 24): int
    {
        $since = new \DateTimeImmutable("-{$hours} hours");

        return (int) $this->createQueryBuilder('l')
            ->select('COUNT(l.id)')
            ->andWhere('l.email = :email')
            ->andWhere('l.createdAt >= :since')
            ->setParameter('email', $email)
            ->setParameter('since', $since)
            ->getQuery()->getSingleScalarResult();
    }

    /** @return Lead[] regroupés par plan (pour KPI MRR potentiel). */
    public function findActiveProspects(): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.status IN (:open)')
            ->setParameter('open', [Lead::STATUS_NOUVEAU, Lead::STATUS_CONTACTE, Lead::STATUS_QUALIFIE])
            ->getQuery()->getResult();
    }
}

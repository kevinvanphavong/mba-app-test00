<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\CompletionHaccpProof;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CompletionHaccpProofRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompletionHaccpProof::class);
    }

    /**
     * Registre HACCP : preuves du centre filtrées par mois optionnel,
     * type de relevé, statut conformité. Ordonne du plus récent au plus ancien.
     *
     * @return CompletionHaccpProof[]
     */
    public function findRegistre(
        Centre $centre,
        ?string $mois = null,        // 'YYYY-MM'
        ?string $typeReleve = null,
        ?bool $conforme = null,      // null = tous, false = uniquement non conformes
    ): array {
        $qb = $this->createQueryBuilder('p')
            ->leftJoin('p.completion', 'c')
            ->leftJoin('c.mission', 'm')
            ->leftJoin('m.haccpSpec', 's')
            ->leftJoin('s.equipement', 'e')
            ->leftJoin('p.relevePar', 'u')
            ->andWhere('p.centre = :centre')
            ->setParameter('centre', $centre)
            ->orderBy('p.createdAt', 'DESC');

        if ($mois) {
            $start = \DateTimeImmutable::createFromFormat('!Y-m', $mois);
            if ($start) {
                $end = $start->modify('+1 month');
                $qb->andWhere('p.createdAt >= :start AND p.createdAt < :end')
                    ->setParameter('start', $start)
                    ->setParameter('end', $end);
            }
        }
        if ($typeReleve) {
            $qb->andWhere('s.typeReleve = :tr')->setParameter('tr', $typeReleve);
        }
        if ($conforme === false) {
            $qb->andWhere('p.estConforme = false');
        } elseif ($conforme === true) {
            $qb->andWhere('p.estConforme = true');
        }

        return $qb->getQuery()->getResult();
    }
}

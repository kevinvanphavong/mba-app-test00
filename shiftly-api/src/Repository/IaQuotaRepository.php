<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\IaQuota;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<IaQuota>
 */
class IaQuotaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, IaQuota::class);
    }

    /**
     * Réserve un appel IA pour (centre, période) SOUS le plafond, de façon atomique.
     *
     * Anti-race : l'incrément est un `UPDATE … WHERE appels < :plafond`, verrouillé
     * au niveau ligne par PostgreSQL — deux requêtes concurrentes sont sérialisées,
     * donc le plafond n'est JAMAIS dépassé. Retourne false si le plafond est atteint
     * (l'appelant refuse alors sans émettre d'appel Mistral).
     */
    public function reserve(Centre $centre, string $periode, int $plafond): bool
    {
        $conn = $this->getEntityManager()->getConnection();
        $params = ['c' => $centre->getId(), 'p' => $periode];

        // Garantit l'existence de la ligne du mois (idempotent, sans écraser un compteur).
        $conn->executeStatement(
            'INSERT INTO ia_quota (centre_id, periode, appels) VALUES (:c, :p, 0)
             ON CONFLICT (centre_id, periode) DO NOTHING',
            $params,
        );

        // Incrément atomique conditionnel au plafond : 1 ligne touchée = réservé.
        $affected = $conn->executeStatement(
            'UPDATE ia_quota SET appels = appels + 1
             WHERE centre_id = :c AND periode = :p AND appels < :plafond',
            $params + ['plafond' => $plafond],
        );

        return 1 === $affected;
    }

    /**
     * Libère un appel réservé (compensation quand l'appel Mistral échoue) : le quota
     * ne doit refléter que la conso réellement aboutie. Ne descend jamais sous 0.
     */
    public function release(Centre $centre, string $periode): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'UPDATE ia_quota SET appels = appels - 1
             WHERE centre_id = :c AND periode = :p AND appels > 0',
            ['c' => $centre->getId(), 'p' => $periode],
        );
    }

    /** Consommation courante d'un centre pour la période (0 si aucune ligne). */
    public function appelsPour(Centre $centre, string $periode): int
    {
        $row = $this->findOneBy(['centre' => $centre, 'periode' => $periode]);

        return $row?->getAppels() ?? 0;
    }
}

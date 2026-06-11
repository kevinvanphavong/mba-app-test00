<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Absence;
use App\Entity\Poste;
use Doctrine\DBAL\Connection;

/**
 * Marque une PlanningWeek comme "dirty" (modifs non publiées).
 *
 * Logique métier extraite de l'ancien PlanningWeekDirtyListener (CLAUDE.md règle 7) :
 * résolution (centre, lundi de la semaine) depuis un Poste/Absence + UPDATE ciblé.
 * Service testable, réutilisable depuis n'importe quel point de mutation du planning.
 *
 * On ne crée jamais de PlanningWeek : une semaine jamais publiée reste implicitement
 * BROUILLON (l'UPDATE n'affecte alors 0 ligne, comportement voulu).
 */
final class PlanningWeekDirtyMarker
{
    public function __construct(private readonly Connection $connection)
    {
    }

    /**
     * Résout (centre_id, weekStart) depuis un Poste ou une Absence.
     *
     * @return array{centreId: int, weekStart: string}|null
     */
    public function keyFor(object $entity): ?array
    {
        if ($entity instanceof Poste) {
            $service = $entity->getService();
            $cid = $service?->getCentre()?->getId();
            $date = $service?->getDate();
        } elseif ($entity instanceof Absence) {
            $cid = $entity->getCentre()?->getId();
            $date = $entity->getDate();
        } else {
            return null;
        }

        // cid peut être null pendant un load fixtures (cascade-persist non flushé)
        if (null === $cid || !$date) {
            return null;
        }

        return ['centreId' => $cid, 'weekStart' => $this->mondayOf($date)];
    }

    /**
     * Bump `last_modified_at` sur les semaines impactées (dédup par centre+semaine).
     *
     * @param array<array{centreId: int, weekStart: string}> $keys
     */
    public function markDirty(array $keys): void
    {
        if ([] === $keys) {
            return;
        }

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // Dédup : une même semaine n'est UPDATE-é qu'une fois.
        $seen = [];
        foreach ($keys as $key) {
            $cacheKey = $key['centreId'].'_'.$key['weekStart'];
            if (isset($seen[$cacheKey])) {
                continue;
            }
            $seen[$cacheKey] = true;

            $this->connection->executeStatement(
                'UPDATE planning_week SET last_modified_at = :now
                 WHERE centre_id = :centreId AND week_start = :weekStart',
                ['now' => $now, 'centreId' => $key['centreId'], 'weekStart' => $key['weekStart']]
            );
        }
    }

    /** Lundi ISO de la semaine contenant cette date (format Y-m-d). */
    private function mondayOf(\DateTimeInterface $date): string
    {
        $imm = $date instanceof \DateTimeImmutable
            ? $date
            : \DateTimeImmutable::createFromInterface($date);
        $dow = (int) $imm->format('N');

        return $imm->modify('-'.($dow - 1).' days')->setTime(0, 0, 0)->format('Y-m-d');
    }
}

<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Absence;
use App\Entity\Poste;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Events;

/**
 * Marque la PlanningWeek comme "dirty" (modifs non publiées) quand un Poste
 * ou une Absence sont insérés / modifiés / supprimés.
 *
 * Algorithme :
 *   1. onFlush : on inspecte la UnitOfWork et on collecte les couples
 *      (centre_id, lundi_de_la_semaine) impactés par chaque entité.
 *      ⚠ Pour les suppressions, l'entité est encore en mémoire à ce stade
 *      (avant le DELETE physique), donc ses relations sont accessibles.
 *   2. postFlush : pour chaque couple collecté, on UPDATE planning_week
 *      via DBAL direct → AUCUN passage par la UoW, donc pas de boucle de
 *      flush et lastModifiedAt n'est bumpé qu'une fois.
 *
 * Convention : on ne crée jamais de PlanningWeek si elle n'existe pas.
 * Une mutation sur une semaine jamais publiée reste implicitement
 * BROUILLON, sans entrée explicite. Le UPDATE n'affecte 0 ligne dans ce
 * cas, ce qui est le comportement voulu.
 */
#[AsDoctrineListener(event: Events::onFlush)]
#[AsDoctrineListener(event: Events::postFlush)]
class PlanningWeekDirtyListener
{
    /** @var array<string, array{centreId: int, weekStart: string}> */
    private array $pendingTouches = [];

    public function onFlush(OnFlushEventArgs $args): void
    {
        $em  = $args->getObjectManager();
        $uow = $em->getUnitOfWork();

        // Collecte tous les Poste/Absence créés, modifiés ou supprimés
        $entities = array_merge(
            $uow->getScheduledEntityInsertions(),
            $uow->getScheduledEntityUpdates(),
            $uow->getScheduledEntityDeletions(),
        );

        foreach ($entities as $entity) {
            $key = $this->resolveTouchKey($entity);
            if ($key !== null) {
                // Dédup : une même semaine ne sera UPDATE-é qu'une seule fois
                $this->pendingTouches[$key['cacheKey']] = [
                    'centreId'  => $key['centreId'],
                    'weekStart' => $key['weekStart'],
                ];
            }
        }
    }

    public function postFlush(PostFlushEventArgs $args): void
    {
        if (empty($this->pendingTouches)) {
            return;
        }

        $conn = $args->getObjectManager()->getConnection();
        $now  = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        // UPDATE direct via DBAL — bypass de la UnitOfWork pour ne pas
        // re-déclencher onFlush (boucle infinie).
        foreach ($this->pendingTouches as $touch) {
            $conn->executeStatement(
                'UPDATE planning_week
                 SET last_modified_at = :now
                 WHERE centre_id = :centreId AND week_start = :weekStart',
                [
                    'now'       => $now,
                    'centreId'  => $touch['centreId'],
                    'weekStart' => $touch['weekStart'],
                ]
            );
        }

        $this->pendingTouches = [];
    }

    /**
     * Résout (centre_id, weekStart) depuis un Poste ou une Absence.
     * Retourne null si l'entité n'est pas concernée ou si une relation manque.
     *
     * @return array{centreId: int, weekStart: string, cacheKey: string}|null
     */
    private function resolveTouchKey(object $entity): ?array
    {
        if ($entity instanceof Poste) {
            $service = $entity->getService();
            $centre  = $service?->getCentre();
            $date    = $service?->getDate();
            if (!$centre || !$date) {
                return null;
            }
            return $this->buildKey($centre->getId(), $date);
        }

        if ($entity instanceof Absence) {
            $centre = $entity->getCentre();
            $date   = $entity->getDate();
            if (!$centre || !$date) {
                return null;
            }
            return $this->buildKey($centre->getId(), $date);
        }

        return null;
    }

    /** @return array{centreId: int, weekStart: string, cacheKey: string} */
    private function buildKey(int $centreId, \DateTimeInterface $date): array
    {
        // Lundi ISO de la semaine contenant cette date
        $imm = $date instanceof \DateTimeImmutable
            ? $date
            : \DateTimeImmutable::createFromInterface($date);
        $dow       = (int) $imm->format('N');
        $monday    = $imm->modify('-' . ($dow - 1) . ' days')->setTime(0, 0, 0);
        $mondayStr = $monday->format('Y-m-d');

        return [
            'centreId'  => $centreId,
            'weekStart' => $mondayStr,
            'cacheKey'  => $centreId . '_' . $mondayStr,
        ];
    }
}

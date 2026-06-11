<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Service\PlanningWeekDirtyMarker;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Events;

/**
 * Marque la PlanningWeek "dirty" quand un Poste/Absence est inséré/modifié/supprimé.
 *
 * La LOGIQUE (résolution centre+semaine, UPDATE) vit dans PlanningWeekDirtyMarker
 * (service testé) — ce listener ne fait plus que collecter les entités impactées et
 * déléguer (CLAUDE.md règle 7 : pas de logique métier ni de DBAL ici).
 *
 * NB : la collecte passe encore par la UnitOfWork (onFlush) car les écritures Poste
 * transitent par API Platform (pas de call-site explicite). Le retrait complet de ce
 * trigger est couplé aux State Processors du palier 5 (cf. RAPPORT_EXECUTION.md).
 */
#[AsDoctrineListener(event: Events::onFlush)]
#[AsDoctrineListener(event: Events::postFlush)]
class PlanningWeekDirtyListener
{
    /** @var array<array{centreId: int, weekStart: string}> */
    private array $pending = [];

    public function __construct(private readonly PlanningWeekDirtyMarker $marker)
    {
    }

    public function onFlush(OnFlushEventArgs $args): void
    {
        $uow = $args->getObjectManager()->getUnitOfWork();

        $entities = array_merge(
            $uow->getScheduledEntityInsertions(),
            $uow->getScheduledEntityUpdates(),
            $uow->getScheduledEntityDeletions(),
        );

        foreach ($entities as $entity) {
            $key = $this->marker->keyFor($entity);
            if (null !== $key) {
                $this->pending[] = $key;
            }
        }
    }

    public function postFlush(PostFlushEventArgs $args): void
    {
        if ([] === $this->pending) {
            return;
        }

        $this->marker->markDirty($this->pending);
        $this->pending = [];
    }
}

<?php

namespace App\EventListener;

use App\Entity\Centre;
use App\Entity\HaccpEquipement;
use App\Service\Haccp\HaccpMissionGenerator;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostFlushEventArgs;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Events;

/**
 * Sync auto des missions HACCP T° après tout CRUD sur HaccpEquipement.
 *
 * Stratégie : collecter les centres impactés en post-persist/post-update/pre-remove,
 * puis appeler HaccpMissionGenerator dans postFlush (en dehors du flush original
 * pour pouvoir flush à nouveau sans corrompre l'UnitOfWork courant).
 *
 * Re-entrancy guard : si la sync génère un flush qui re-trigger postFlush,
 * on n'agit qu'une seule fois par cycle.
 */
#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::postUpdate)]
#[AsDoctrineListener(event: Events::preRemove)]
#[AsDoctrineListener(event: Events::postFlush)]
final class HaccpEquipementSyncListener
{
    /** @var array<int, Centre> */
    private array $pendingCentres = [];
    private bool $running = false;

    public function __construct(private readonly HaccpMissionGenerator $generator)
    {
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $this->queue($args->getObject());
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $this->queue($args->getObject());
    }

    public function preRemove(PreRemoveEventArgs $args): void
    {
        $this->queue($args->getObject());
    }

    public function postFlush(PostFlushEventArgs $args): void
    {
        if ($this->running || empty($this->pendingCentres)) {
            return;
        }
        $this->running = true;
        try {
            $centres = $this->pendingCentres;
            $this->pendingCentres = [];
            foreach ($centres as $centre) {
                $this->generator->synchronizeForCentre($centre);
            }
        } finally {
            $this->running = false;
        }
    }

    private function queue(object $entity): void
    {
        if (!$entity instanceof HaccpEquipement) {
            return;
        }
        $centre = $entity->getCentre();
        if (!$centre || null === $centre->getId()) {
            return;
        }
        $this->pendingCentres[$centre->getId()] = $centre;
    }
}

<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Completion;
use App\Message\CleanupR2ObjectMessage;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Planifie la suppression asynchrone du binaire R2 d'une Completion supprimée.
 *
 * preRemove : l'entité est encore hydratée (getPhotoPath() lisible). On dispatche
 * un CleanupR2ObjectMessage (idempotent + retry) au lieu d'appeler R2 en synchrone
 * dans la transaction.
 */
#[AsEntityListener(event: Events::preRemove, entity: Completion::class, method: 'preRemove')]
class CompletionPhotoCleanupListener
{
    public function __construct(
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function preRemove(Completion $completion): void
    {
        $photoPath = $completion->getPhotoPath();
        if (null === $photoPath) {
            return;
        }

        $this->bus->dispatch(new CleanupR2ObjectMessage($photoPath));
    }
}

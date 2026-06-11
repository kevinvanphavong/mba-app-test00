<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Media;
use App\Message\CleanupR2ObjectMessage;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Quand une ligne Media est supprimée (via API Platform DELETE ou cascade
 * depuis MissionMediaCleanupListener / TutorielMediaCleanupListener),
 * on planifie la suppression asynchrone du binaire R2 associé.
 *
 * Le listener ne fait plus d'appel réseau R2 synchrone (qui pouvait casser/bloquer
 * la requête) : il dispatche un CleanupR2ObjectMessage (suppression idempotente
 * + retry via Messenger). On utilise preRemove pour avoir storagePath encore lisible.
 */
#[AsEntityListener(event: Events::preRemove, entity: Media::class, method: 'preRemove')]
class MediaR2CleanupListener
{
    public function __construct(
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function preRemove(Media $media): void
    {
        $this->bus->dispatch(new CleanupR2ObjectMessage($media->getStoragePath()));
    }
}

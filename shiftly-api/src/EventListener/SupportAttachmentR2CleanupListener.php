<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\SupportAttachment;
use App\Message\CleanupR2ObjectMessage;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Planifie la suppression asynchrone du binaire R2 d'un SupportAttachment supprimé.
 *
 * preRemove : storedPath encore lisible. On dispatche un CleanupR2ObjectMessage
 * (idempotent + retry) au lieu d'un appel R2 synchrone dans la transaction.
 */
#[AsEntityListener(event: Events::preRemove, entity: SupportAttachment::class, method: 'preRemove')]
class SupportAttachmentR2CleanupListener
{
    public function __construct(
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function preRemove(SupportAttachment $attachment): void
    {
        $storedPath = $attachment->getStoredPath();
        if (null === $storedPath) {
            return;
        }

        $this->bus->dispatch(new CleanupR2ObjectMessage($storedPath));
    }
}

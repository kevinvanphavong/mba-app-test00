<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use App\Enum\MediaEntityType;
use App\Message\CleanupR2ObjectMessage;
use App\Repository\MediaRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Quand un employé (User) est supprimé, on nettoie ses documents (Media
 * polymorphes de type EmployeDocument) : binaire R2 supprimé en async,
 * ligne BDD dans la transaction courante.
 *
 * Symétrique de MissionMediaCleanupListener / TutorielMediaCleanupListener.
 */
#[AsEntityListener(event: Events::preRemove, entity: User::class, method: 'preRemove')]
class UserMediaCleanupListener
{
    public function __construct(
        private readonly MediaRepository $mediaRepository,
        private readonly MessageBusInterface $bus,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function preRemove(User $user): void
    {
        $userId = $user->getId();
        if (null === $userId) {
            return;
        }

        $medias = $this->mediaRepository->findAllByEntity(MediaEntityType::EmployeDocument, $userId);

        foreach ($medias as $media) {
            $this->bus->dispatch(new CleanupR2ObjectMessage($media->getStoragePath()));
            $this->em->remove($media);
        }
    }
}

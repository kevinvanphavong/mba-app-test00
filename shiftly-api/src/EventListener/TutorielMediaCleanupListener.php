<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Tutoriel;
use App\Enum\MediaEntityType;
use App\Message\CleanupR2ObjectMessage;
use App\Repository\MediaRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Nettoie les Media attachés à un Tutoriel à sa suppression.
 * Cf. MissionMediaCleanupListener pour la motivation (polymorphisme sans FK).
 * Le binaire R2 part en suppression asynchrone (CleanupR2ObjectMessage).
 */
#[AsEntityListener(event: Events::preRemove, entity: Tutoriel::class, method: 'preRemove')]
class TutorielMediaCleanupListener
{
    public function __construct(
        private readonly MediaRepository $mediaRepository,
        private readonly MessageBusInterface $bus,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function preRemove(Tutoriel $tutoriel): void
    {
        $tutorielId = $tutoriel->getId();
        if (null === $tutorielId) {
            return;
        }

        $medias = $this->mediaRepository->findAllByEntity(MediaEntityType::Tutoriel, $tutorielId);

        foreach ($medias as $media) {
            $this->bus->dispatch(new CleanupR2ObjectMessage($media->getStoragePath()));
            $this->em->remove($media);
        }
    }
}

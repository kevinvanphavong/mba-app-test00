<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Tutoriel;
use App\Enum\MediaEntityType;
use App\Repository\MediaRepository;
use App\Service\R2StorageService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;

/**
 * Pendant Mission : nettoie les Media attachés à un Tutoriel à sa suppression.
 * Cf. MissionMediaCleanupListener pour la motivation (polymorphisme sans FK).
 */
#[AsEntityListener(event: Events::preRemove, entity: Tutoriel::class, method: 'preRemove')]
class TutorielMediaCleanupListener
{
    public function __construct(
        private readonly MediaRepository $mediaRepository,
        private readonly R2StorageService $r2,
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
            try {
                $this->r2->delete($media->getStoragePath());
            } catch (\Throwable $e) {
                error_log(sprintf(
                    '[TutorielMediaCleanupListener] Échec suppression R2 (%s) : %s',
                    $media->getStoragePath(),
                    $e->getMessage(),
                ));
            }

            $this->em->remove($media);
        }
    }
}

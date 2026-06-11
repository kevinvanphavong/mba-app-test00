<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Media;
use App\Service\R2StorageService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Quand une ligne Media est supprimée (via API Platform DELETE ou cascade
 * depuis MissionMediaCleanupListener / TutorielMediaCleanupListener),
 * on supprime le binaire R2 associé.
 *
 * Note : MissionMediaCleanupListener / TutorielMediaCleanupListener
 * suppriment déjà le binaire R2 explicitement avant le remove() — l'appel
 * ici sera idempotent (R2 ignore les delete sur clés inexistantes).
 *
 * On utilise preRemove pour avoir storagePath encore lisible.
 */
#[AsEntityListener(event: Events::preRemove, entity: Media::class, method: 'preRemove')]
class MediaR2CleanupListener
{
    public function __construct(
        private readonly R2StorageService $r2,
    ) {
    }

    public function preRemove(Media $media): void
    {
        try {
            $this->r2->delete($media->getStoragePath());
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[MediaR2CleanupListener] Échec suppression R2 (%s) : %s',
                $media->getStoragePath(),
                $e->getMessage(),
            ));
        }
    }
}

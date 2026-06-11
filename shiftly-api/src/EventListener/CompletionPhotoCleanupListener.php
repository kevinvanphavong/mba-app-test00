<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Completion;
use App\Service\R2StorageService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Supprime le binaire R2 d'une Completion supprimée (preRemove).
 *
 * Pourquoi preRemove (et pas postRemove) :
 *   - L'entité est encore hydratée (on a getPhotoPath()).
 *   - On supprime le binaire R2 AVANT le DELETE BDD pour éviter les orphelins.
 *
 * Idempotent : R2 ignore les delete sur clé inexistante. Si l'appel R2
 * plante (réseau, credentials), on log mais on ne casse pas la transaction.
 */
#[AsEntityListener(event: Events::preRemove, entity: Completion::class, method: 'preRemove')]
class CompletionPhotoCleanupListener
{
    public function __construct(
        private readonly R2StorageService $r2,
    ) {
    }

    public function preRemove(Completion $completion): void
    {
        $photoPath = $completion->getPhotoPath();
        if (null === $photoPath) {
            return;
        }

        try {
            $this->r2->delete($photoPath);
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[CompletionPhotoCleanupListener] Échec suppression R2 (%s) : %s',
                $photoPath,
                $e->getMessage(),
            ));
        }
    }
}

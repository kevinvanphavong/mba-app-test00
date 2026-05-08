<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\SupportAttachment;
use App\Service\R2StorageService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Supprime le binaire R2 d'un SupportAttachment supprimé (preRemove).
 *
 * Pourquoi preRemove (et pas postRemove) :
 *   - storedPath encore lisible
 *   - delete R2 AVANT le DELETE BDD (sinon orphelins sur le bucket)
 *
 * Idempotent (R2 ignore les delete sur clé inexistante). Les erreurs réseau
 * sont logguées sans casser la transaction.
 */
#[AsEntityListener(event: Events::preRemove, entity: SupportAttachment::class, method: 'preRemove')]
class SupportAttachmentR2CleanupListener
{
    public function __construct(
        private readonly R2StorageService $r2,
    ) {}

    public function preRemove(SupportAttachment $attachment): void
    {
        $storedPath = $attachment->getStoredPath();
        if ($storedPath === null) {
            return;
        }

        try {
            $this->r2->delete($storedPath);
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[SupportAttachmentR2CleanupListener] Échec suppression R2 (%s) : %s',
                $storedPath,
                $e->getMessage(),
            ));
        }
    }
}

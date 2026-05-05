<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Completion;
use App\Service\FileUploadService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Supprime le fichier photo physique sur disque quand une Completion
 * porteuse d'une photo est retirée de la BDD.
 *
 * Pourquoi PreRemove (et pas PostRemove) :
 *   - L'entité est encore hydratée (on a getPhotoPath()).
 *   - Si le DELETE SQL échoue après, on aura supprimé le fichier orphelin
 *     d'une ligne qui n'aurait jamais dû partir — mais ce cas est extrêmement
 *     rare et la commande completion:cleanup-orphan-photos sert de filet.
 *   - À l'inverse, un PostRemove qui plante laisserait le fichier à vie.
 *
 * Évite l'accumulation de photos « supprimées côté user » qui restaient
 * jusqu'ici indéfiniment dans public/uploads/completion/.
 */
#[AsEntityListener(event: Events::preRemove, entity: Completion::class, method: 'preRemove')]
class CompletionPhotoCleanupListener
{
    public function __construct(
        private readonly FileUploadService $fileUploader,
    ) {}

    public function preRemove(Completion $completion): void
    {
        $photoPath = $completion->getPhotoPath();
        if ($photoPath === null) {
            return;
        }

        $this->fileUploader->deleteCompletionPhoto($photoPath);
    }
}

<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Mission;
use App\Enum\MediaEntityType;
use App\Repository\MediaRepository;
use App\Service\R2StorageService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;

/**
 * Quand une Mission est supprimée, on nettoie les Media polymorphes attachés :
 *   - binaire R2 supprimé AVANT la ligne BDD (sinon orphelins sur le bucket)
 *   - ligne Media supprimée juste après
 *
 * On utilise preRemove (et pas postRemove) car l'entité Mission est encore
 * hydratée et son id est nécessaire pour résoudre les médias via le repository.
 *
 * Pourquoi pas de FK SQL avec ON DELETE CASCADE : Media est polymorphe
 * (entityType + entityId), pas de relation Doctrine vers Mission.
 */
#[AsEntityListener(event: Events::preRemove, entity: Mission::class, method: 'preRemove')]
class MissionMediaCleanupListener
{
    public function __construct(
        private readonly MediaRepository        $mediaRepository,
        private readonly R2StorageService       $r2,
        private readonly EntityManagerInterface $em,
    ) {}

    public function preRemove(Mission $mission): void
    {
        $missionId = $mission->getId();
        if ($missionId === null) {
            return;
        }

        $medias = $this->mediaRepository->findAllByEntity(MediaEntityType::Mission, $missionId);

        foreach ($medias as $media) {
            // Supprime le binaire R2 d'abord — si ça plante, on log et on continue,
            // mais la ligne BDD doit aussi partir pour rester cohérent côté UI.
            try {
                $this->r2->delete($media->getStoragePath());
            } catch (\Throwable $e) {
                error_log(sprintf(
                    '[MissionMediaCleanupListener] Échec suppression R2 (%s) : %s',
                    $media->getStoragePath(),
                    $e->getMessage(),
                ));
            }

            $this->em->remove($media);
        }
    }
}

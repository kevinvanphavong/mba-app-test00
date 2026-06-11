<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Mission;
use App\Enum\MediaEntityType;
use App\Message\CleanupR2ObjectMessage;
use App\Repository\MediaRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;
use Symfony\Component\Messenger\MessageBusInterface;

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
        private readonly MediaRepository $mediaRepository,
        private readonly MessageBusInterface $bus,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function preRemove(Mission $mission): void
    {
        $missionId = $mission->getId();
        if (null === $missionId) {
            return;
        }

        $medias = $this->mediaRepository->findAllByEntity(MediaEntityType::Mission, $missionId);

        foreach ($medias as $media) {
            // Suppression du binaire R2 en asynchrone (idempotent + retry) ; la ligne
            // BDD part dans la transaction courante.
            $this->bus->dispatch(new CleanupR2ObjectMessage($media->getStoragePath()));
            $this->em->remove($media);
        }
    }
}

<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Pointage;
use App\Entity\Poste;
use App\Repository\PointageRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Events;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * Garde-fou métier sur la suppression d'un Poste :
 *
 *   - Si un Pointage existe et est actif (EN_COURS / EN_PAUSE / TERMINE / ABSENT)
 *     → on REFUSE le DELETE (409 Conflict). Préserve l'historique.
 *   - Si un Pointage existe en statut PREVU (jamais commencé)
 *     → on le supprime en cascade (em->remove) puis on laisse passer le DELETE
 *       du Poste. La suppression du Pointage est flushée dans la même
 *       transaction.
 *   - Pas de Pointage → DELETE Poste normal.
 *
 * Pourquoi un listener Doctrine plutôt qu'un endpoint custom :
 *   API Platform expose DELETE /api/postes/{id} automatiquement. Plutôt que de
 *   le redéfinir, on intercepte au niveau Doctrine pour garantir la même règle
 *   quel que soit le point d'entrée (API Platform, command, fixtures, etc.).
 */
#[AsDoctrineListener(event: Events::preRemove)]
class PostePreRemoveListener
{
    public function __construct(
        private readonly PointageRepository $pointageRepo,
    ) {}

    public function preRemove(PreRemoveEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Poste) {
            return;
        }

        $pointage = $this->pointageRepo->findOneBy(['poste' => $entity]);
        if ($pointage === null) {
            return;
        }

        // Pointage actif ou historique → on protège
        if ($pointage->getStatut() !== Pointage::STATUT_PREVU) {
            throw new ConflictHttpException(
                "Impossible de retirer ce staff : son pointage est déjà commencé."
            );
        }

        // Pointage PREVU jamais commencé → cascade safe
        $args->getObjectManager()->remove($pointage);
    }
}

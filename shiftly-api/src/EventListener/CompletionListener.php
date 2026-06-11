<?php

namespace App\EventListener;

use App\Entity\Completion;
use App\Service\CompletionRateCalculator;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;

/**
 * Recalcule taux_completion sur le Service après chaque cochage / décochage.
 *
 * Ce listener ne porte plus de logique métier ni d'accès BDD : il délègue au
 * service testé CompletionRateCalculator (CLAUDE.md règle 7). On garde le trigger
 * entity-listener (et pas onFlush) pour un recalcul immédiat et synchrone — le
 * taux doit être à jour dès le retour de la requête (affiché par l'UI).
 */
#[AsEntityListener(event: Events::postPersist, entity: Completion::class, method: 'recompute')]
#[AsEntityListener(event: Events::postRemove, entity: Completion::class, method: 'recompute')]
class CompletionListener
{
    public function __construct(
        private readonly CompletionRateCalculator $calculator,
    ) {
    }

    public function recompute(Completion $completion): void
    {
        $service = $completion->getPoste()?->getService();
        if (!$service) {
            return;
        }

        $this->calculator->recompute($service);
    }
}

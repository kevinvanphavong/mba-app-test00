<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\ServiceRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Garde-fou pour les opérations de planification.
 *
 * Empêche notamment de créer/modifier un Service ou un Poste à une date
 * antérieure au "service du jour" (référence du dashboard, cutoff 5h pour
 * gérer les services de nuit).
 */
class PlanningGuardService
{
    public function __construct(
        private readonly ServiceRepository $serviceRepository,
    ) {}

    /**
     * Date la plus ancienne autorisée pour créer/modifier un service.
     * Aligné sur la logique findTodayActive : avant 5h on est encore "hier".
     */
    public function getMinAllowedDate(): \DateTimeImmutable
    {
        $now = new \DateTimeImmutable();
        $reference = (int) $now->format('H') < 5
            ? $now->modify('-1 day')
            : $now;

        return $reference->setTime(0, 0, 0);
    }

    /**
     * Vérifie que la date n'est pas antérieure au service du jour.
     * Lève BadRequestHttpException sinon.
     */
    public function assertDateNotInPast(\DateTimeInterface $date): void
    {
        $min  = $this->getMinAllowedDate();
        $cmp  = $date instanceof \DateTimeImmutable
            ? $date->setTime(0, 0, 0)
            : \DateTimeImmutable::createFromInterface($date)->setTime(0, 0, 0);

        if ($cmp < $min) {
            throw new BadRequestHttpException(sprintf(
                'Impossible de créer ou modifier un service à une date antérieure au service du jour (%s).',
                $min->format('d/m/Y')
            ));
        }
    }
}

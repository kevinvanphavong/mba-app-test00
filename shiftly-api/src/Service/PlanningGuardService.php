<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\ServiceRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Garde-fou pour les opérations de planification.
 *
 * Empêche notamment de créer/modifier un Service ou un Poste à une date
 * antérieure au « jour actif » (référence du dashboard, bascule à 5h pour
 * gérer les services de nuit). La résolution du jour actif passe par
 * {@see ActiveDayResolver}, source de vérité unique côté backend.
 */
class PlanningGuardService
{
    public function __construct(
        private readonly ServiceRepository $serviceRepository,
        private readonly ActiveDayResolver $activeDayResolver,
    ) {}

    /**
     * Date la plus ancienne autorisée pour créer/modifier un service —
     * c'est exactement le « jour actif » du centre.
     */
    public function getMinAllowedDate(): \DateTimeImmutable
    {
        return $this->activeDayResolver->getActiveDate();
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

<?php

namespace App\Service;

use App\Entity\Service;

/**
 * Calcule le statut affiché d'un service de manière dynamique.
 *
 * Le champ `statut` en BDD n'est jamais mis à jour automatiquement
 * (il reste à PLANIFIE après création, sauf TERMINE posé manuellement).
 * Ce service centralise la logique de résolution pour que tous les
 * controllers utilisent la même règle.
 *
 * Règles (la notion de « jour » s'entend ici comme le « jour actif »
 * du centre, qui bascule à 5h du matin via {@see ActiveDayResolver}) :
 *  - Si le statut BDD est TERMINE → TERMINE (statut posé manuellement)
 *  - Si la date du service < jour actif → TERMINE
 *  - Si la date du service = jour actif → EN_COURS
 *  - Sinon → PLANIFIE
 */
class ServiceStatutResolver
{
    public function __construct(
        private readonly ActiveDayResolver $activeDayResolver,
    ) {}

    public function resolve(Service $service): string
    {
        if ($service->getStatut() === 'TERMINE') {
            return 'TERMINE';
        }

        $serviceDate = $service->getDate();
        if ($serviceDate === null) {
            return $service->getStatut();
        }

        $today = $this->activeDayResolver->getActiveDate();

        if ($serviceDate < $today) {
            return 'TERMINE';
        }

        if ($serviceDate->format('Y-m-d') === $today->format('Y-m-d')) {
            return 'EN_COURS';
        }

        return 'PLANIFIE';
    }
}

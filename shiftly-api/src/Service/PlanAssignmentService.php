<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Plan;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Assigne un {@see Plan} à un {@see Centre} et DÉRIVE son `abonnementMensuelCents` du
 * prix du plan (source unique de vérité du tarif → alimente le MRR de la console).
 * Logique métier centralisée ici (jamais dans le contrôleur/processor). Détacher un
 * plan (null) remet l'abonnement à 0 (plus de pack = plus de facturation récurrente).
 */
final class PlanAssignmentService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function assigner(Centre $centre, ?Plan $plan): void
    {
        $centre->setPlan($plan);
        $centre->setAbonnementMensuelCents($plan?->getPrixMensuelCents() ?? 0);
        $this->em->flush();
    }
}

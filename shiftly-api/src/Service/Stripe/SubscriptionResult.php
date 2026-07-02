<?php

namespace App\Service\Stripe;

/**
 * Résultat minimal d'une création/mise à jour d'abonnement Stripe : de quoi persister
 * l'entité Subscription côté Shiftly. Découple le reste du code du SDK Stripe.
 */
final class SubscriptionResult
{
    public function __construct(
        public readonly string $customerId,
        public readonly string $subscriptionId,
        public readonly string $statut,
        public readonly int $montantCents,
    ) {
    }
}

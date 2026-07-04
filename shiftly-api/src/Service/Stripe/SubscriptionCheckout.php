<?php

namespace App\Service\Stripe;

/**
 * Résultat de la création d'une Checkout Session Stripe (mode subscription) : l'URL de
 * paiement hébergée à transmettre au client + le Customer réutilisable. Aucune donnée
 * carte ne transite par Shiftly.
 */
final class SubscriptionCheckout
{
    public function __construct(
        public readonly string $checkoutUrl,
        public readonly string $customerId,
    ) {
    }
}

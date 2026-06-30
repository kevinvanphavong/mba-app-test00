<?php

namespace App\Service\Stripe;

/**
 * Résultat minimal d'une création de session Checkout : l'id (traçabilité) et
 * l'URL hébergée vers laquelle rediriger le visiteur. Découple le reste du code
 * du SDK Stripe (cf. {@see CheckoutGatewayInterface}).
 */
final class CheckoutSession
{
    public function __construct(
        public readonly string $id,
        public readonly string $url,
    ) {
    }
}

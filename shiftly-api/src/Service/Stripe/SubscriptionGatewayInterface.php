<?php

namespace App\Service\Stripe;

use App\Entity\Centre;
use App\Entity\Plan;

/**
 * Seam de facturation récurrente (compte Stripe de l'AGENCE) : isole le SDK Stripe
 * du reste de l'app (testabilité + remplaçabilité). L'implémentation réelle crée/met à
 * jour un Customer + une Subscription ; les tests fournissent un faux gateway (zéro réseau).
 */
interface SubscriptionGatewayInterface
{
    /**
     * Crée (ou met à jour) l'abonnement Stripe d'un centre pour le plan donné.
     * Le montant facturé est TOUJOURS le prix du plan (source serveur), jamais une
     * valeur fournie par le client. `$stripeCustomerId` réutilise un Customer existant.
     */
    public function ensureSubscription(Centre $centre, Plan $plan, ?string $stripeCustomerId): SubscriptionResult;
}

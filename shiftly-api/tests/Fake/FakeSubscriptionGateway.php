<?php

namespace App\Tests\Fake;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Service\Stripe\SubscriptionGatewayInterface;
use App\Service\Stripe\SubscriptionResult;

/**
 * Faux gateway d'abonnement pour les tests : aucun appel réseau. Retourne des ids
 * déterministes dérivés du centre et le montant = prix du plan.
 */
final class FakeSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function ensureSubscription(Centre $centre, Plan $plan, ?string $stripeCustomerId): SubscriptionResult
    {
        $id = $centre->getId();

        return new SubscriptionResult(
            customerId: $stripeCustomerId ?? 'cus_fake_'.$id,
            subscriptionId: 'sub_fake_'.$id,
            statut: 'active',
            montantCents: $plan->getPrixMensuelCents(),
        );
    }
}

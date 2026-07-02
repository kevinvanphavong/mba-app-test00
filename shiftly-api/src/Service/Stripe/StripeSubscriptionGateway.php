<?php

namespace App\Service\Stripe;

use App\Entity\Centre;
use App\Entity\Plan;
use Stripe\StripeClient;

/**
 * Implémentation Stripe Billing (compte AGENCE) : crée/réutilise un Customer et crée
 * une Subscription au prix du plan (price_data inline, mensuel EUR). Aucune donnée carte
 * ne transite par Shiftly. Le montant facturé est TOUJOURS `plan->getPrixMensuelCents()`.
 */
final class StripeSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function __construct(private readonly string $stripeSecretKey)
    {
    }

    public function ensureSubscription(Centre $centre, Plan $plan, ?string $stripeCustomerId): SubscriptionResult
    {
        $stripe = new StripeClient($this->stripeSecretKey);

        // Réutilise le Customer existant du centre, sinon en crée un (métadonnée = centreId).
        $customerId = $stripeCustomerId;
        if (null === $customerId || '' === $customerId) {
            $customer = $stripe->customers->create([
                'name' => $centre->getNom() ?? 'Centre',
                'metadata' => ['centreId' => (string) $centre->getId()],
            ]);
            $customerId = (string) $customer->id;
        }

        // Flux canonique Product → Price → Subscription. Montant FIGÉ = prix du plan.
        $price = $stripe->prices->create([
            'currency' => 'eur',
            'unit_amount' => $plan->getPrixMensuelCents(),
            'recurring' => ['interval' => 'month'],
            'product_data' => ['name' => sprintf('Abonnement Shiftly — %s', $plan->getNom() ?? 'plan')],
        ]);

        $subscription = $stripe->subscriptions->create([
            'customer' => $customerId,
            'items' => [['price' => (string) $price->id]],
            'metadata' => ['centreId' => (string) $centre->getId(), 'planCle' => (string) $plan->getCle()],
        ]);

        return new SubscriptionResult(
            customerId: $customerId,
            subscriptionId: (string) $subscription->id,
            statut: (string) $subscription->status,
            montantCents: $plan->getPrixMensuelCents(),
        );
    }
}

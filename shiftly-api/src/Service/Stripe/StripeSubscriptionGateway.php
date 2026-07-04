<?php

namespace App\Service\Stripe;

use App\Entity\Centre;
use App\Entity\Plan;
use Stripe\StripeClient;

/**
 * Implémentation Stripe Billing (compte AGENCE). Flux : Product/Price réutilisés par plan
 * → Checkout Session `mode: subscription` (lien de paiement hébergé) → l'abonnement réel
 * est créé par Stripe à la complétion du Checkout (webhook checkout.session.completed).
 * Aucune donnée carte ne transite par Shiftly ; le montant est TOUJOURS le prix du plan.
 */
final class StripeSubscriptionGateway implements SubscriptionGatewayInterface
{
    public function __construct(private readonly string $stripeSecretKey)
    {
    }

    public function ensurePrice(Plan $plan): bool
    {
        $stripe = $this->client();

        // Product réutilisé (créé une fois par plan).
        if (null === $plan->getStripeProductId()) {
            $product = $stripe->products->create(['name' => sprintf('Abonnement Shiftly — %s', $plan->getNom() ?? 'plan')]);
            $plan->setStripeProductId((string) $product->id);
        }

        // Price réutilisé tant que le montant correspond ; recréé si le prix du plan a changé
        // (les Prices Stripe sont immuables).
        if (null !== $plan->getStripePriceId()) {
            $current = $stripe->prices->retrieve($plan->getStripePriceId());
            if ((int) $current->unit_amount === $plan->getPrixMensuelCents() && 'eur' === $current->currency) {
                return false; // réutilisé
            }
        }

        $price = $stripe->prices->create([
            'currency' => 'eur',
            'unit_amount' => $plan->getPrixMensuelCents(),
            'recurring' => ['interval' => 'month'],
            'product' => (string) $plan->getStripeProductId(),
        ]);
        $plan->setStripePriceId((string) $price->id);

        return true; // nouveau Price créé
    }

    public function createSubscriptionCheckout(Centre $centre, Plan $plan, ?string $customerId, string $successUrl, string $cancelUrl): SubscriptionCheckout
    {
        $stripe = $this->client();

        // Customer réutilisé (métadonnée = centreId), sinon créé.
        if (null === $customerId || '' === $customerId) {
            $customer = $stripe->customers->create([
                'name' => $centre->getNom() ?? 'Centre',
                'metadata' => ['centreId' => (string) $centre->getId()],
            ]);
            $customerId = (string) $customer->id;
        }

        $subscriptionData = ['metadata' => ['centreId' => (string) $centre->getId(), 'planCle' => (string) $plan->getCle()]];
        if ($plan->getJoursEssai() > 0) {
            $subscriptionData['trial_period_days'] = $plan->getJoursEssai();
        }

        $session = $stripe->checkout->sessions->create([
            'mode' => 'subscription',
            'customer' => $customerId,
            'line_items' => [['price' => (string) $plan->getStripePriceId(), 'quantity' => 1]],
            'subscription_data' => $subscriptionData,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return new SubscriptionCheckout((string) $session->url, $customerId);
    }

    public function cancelAtPeriodEnd(string $stripeSubscriptionId): void
    {
        $this->client()->subscriptions->update($stripeSubscriptionId, ['cancel_at_period_end' => true]);
    }

    private function client(): StripeClient
    {
        return new StripeClient($this->stripeSecretKey);
    }
}

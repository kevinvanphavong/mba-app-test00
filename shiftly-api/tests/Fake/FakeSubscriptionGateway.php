<?php

namespace App\Tests\Fake;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Service\Stripe\SubscriptionCheckout;
use App\Service\Stripe\SubscriptionGatewayInterface;

/**
 * Faux gateway d'abonnement pour les tests : aucun appel réseau. Ids déterministes,
 * Price réutilisé tant que le prix ne change pas, et traçage des annulations / créations
 * de Price pour les assertions.
 */
final class FakeSubscriptionGateway implements SubscriptionGatewayInterface
{
    /** @var list<string> subscriptionIds résiliés (cancel_at_period_end) */
    public array $cancelled = [];
    /** Nombre de Prices Stripe créés (0 si tout réutilisé). */
    public int $pricesCreated = 0;
    /** URLs de retour reçues au dernier Checkout (pour vérifier la cible cockpit). */
    public ?string $lastSuccessUrl = null;
    public ?string $lastCancelUrl = null;

    public function ensurePrice(Plan $plan): bool
    {
        // Le priceId encode le montant → un prix inchangé est réutilisé, un prix modifié recrée.
        $wanted = 'price_fake_'.$plan->getId().'_'.$plan->getPrixMensuelCents();
        if ($plan->getStripePriceId() === $wanted) {
            return false; // réutilisé
        }

        $plan->setStripeProductId($plan->getStripeProductId() ?? 'prod_fake_'.$plan->getId());
        $plan->setStripePriceId($wanted);
        ++$this->pricesCreated;

        return true; // nouveau Price
    }

    public function createSubscriptionCheckout(Centre $centre, Plan $plan, ?string $customerId, string $successUrl, string $cancelUrl): SubscriptionCheckout
    {
        $this->lastSuccessUrl = $successUrl;
        $this->lastCancelUrl = $cancelUrl;

        return new SubscriptionCheckout(
            checkoutUrl: 'https://checkout.stripe.test/cs_fake_'.$centre->getId(),
            customerId: $customerId ?? 'cus_fake_'.$centre->getId(),
        );
    }

    public function cancelAtPeriodEnd(string $stripeSubscriptionId): void
    {
        $this->cancelled[] = $stripeSubscriptionId;
    }
}

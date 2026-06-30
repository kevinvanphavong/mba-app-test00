<?php

namespace App\Tests\Fake;

use App\Entity\Reservation;
use App\Service\Stripe\CheckoutGatewayInterface;
use App\Service\Stripe\CheckoutSession;

/**
 * Faux gateway Checkout pour les tests : aucun appel réseau Stripe. Enregistre la
 * réservation et le montant demandés pour permettre les assertions, et renvoie une
 * URL canned. Branché à la place du gateway réel en env test (services.yaml).
 */
final class FakeCheckoutGateway implements CheckoutGatewayInterface
{
    public ?Reservation $lastReservation = null;
    public ?int $lastAmountCents = null;
    public ?string $lastSuccessUrl = null;

    public function createSession(Reservation $reservation, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $this->lastReservation = $reservation;
        $this->lastAmountCents = $reservation->getAcompteCents();
        $this->lastSuccessUrl = $successUrl;

        return new CheckoutSession(
            'cs_test_fake_'.$reservation->getId(),
            'https://checkout.stripe.test/pay/cs_test_fake_'.$reservation->getId(),
        );
    }
}

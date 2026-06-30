<?php

namespace App\Service\Stripe;

use App\Entity\Reservation;
use Stripe\StripeClient;

/**
 * Implémentation Stripe Checkout HÉBERGÉ : aucune donnée carte ne transite par
 * Shiftly. Encaisse l'acompte figé de la réservation et embarque l'id de résa
 * dans les métadonnées (relu, signé, par le webhook pour confirmer la bonne résa).
 */
final class StripeCheckoutGateway implements CheckoutGatewayInterface
{
    public function __construct(private readonly string $stripeSecretKey)
    {
    }

    public function createSession(Reservation $reservation, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $stripe = new StripeClient($this->stripeSecretKey);

        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'eur',
                    // Montant FIGÉ côté serveur (acompte de la résa), jamais recalculé.
                    'unit_amount' => $reservation->getAcompteCents(),
                    'product_data' => [
                        'name' => sprintf('Acompte — %s', $reservation->getPrestation()?->getNom() ?? 'réservation'),
                    ],
                ],
            ]],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $reservation->getId(),
            // Métadonnées relues par le webhook (signé) pour confirmer LA bonne résa.
            'metadata' => [
                'reservationId' => (string) $reservation->getId(),
                'centreId' => (string) $reservation->getCentre()?->getId(),
            ],
        ]);

        return new CheckoutSession((string) $session->id, (string) $session->url);
    }
}

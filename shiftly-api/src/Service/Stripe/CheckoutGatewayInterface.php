<?php

namespace App\Service\Stripe;

use App\Entity\Reservation;

/**
 * Seam de paiement : isole le SDK Stripe du reste de l'app (testabilité +
 * remplaçabilité). L'implémentation réelle crée une session Checkout hébergée ;
 * les tests fournissent un faux gateway sans appel réseau.
 */
interface CheckoutGatewayInterface
{
    /**
     * Crée une session Checkout pour l'acompte d'une réservation.
     *
     * Le montant encaissé est TOUJOURS l'acompte figé de la réservation
     * (`getAcompteCents()`), jamais une valeur fournie par le client.
     */
    public function createSession(Reservation $reservation, string $successUrl, string $cancelUrl): CheckoutSession;
}

<?php

namespace App\Message;

/**
 * Effet de bord asynchrone d'une réservation confirmée : envoi de l'email de
 * confirmation à l'invité. Dispatché par le webhook Stripe APRÈS le changement
 * de statut — jamais d'envoi synchrone dans la requête webhook (CLAUDE.md règle 8).
 * Ne transporte qu'un id (sérialisable, rechargé par le handler).
 */
final class ReservationConfirmeeMessage
{
    public function __construct(public readonly int $reservationId)
    {
    }
}

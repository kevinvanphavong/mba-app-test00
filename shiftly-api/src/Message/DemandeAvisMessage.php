<?php

namespace App\Message;

/**
 * Planifie (différé) l'envoi d'un lien de collecte d'avis après une visite honorée.
 * À échéance, si la réservation est confirmée, un email avec le lien d'avis est
 * envoyé (via Messenger). N'envoie rien pour un no-show.
 */
final class DemandeAvisMessage
{
    public function __construct(public readonly int $reservationId)
    {
    }
}

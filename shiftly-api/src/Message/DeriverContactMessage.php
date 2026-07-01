<?php

namespace App\Message;

/**
 * Dérive/actualise un contact CRM depuis une source (réservation ou demande B2B),
 * en asynchrone. Ne transporte que la source + l'id (rechargés par le handler).
 */
final class DeriverContactMessage
{
    public const SOURCE_RESERVATION = 'reservation';
    public const SOURCE_DEMANDE = 'demande';

    public function __construct(
        public readonly string $source,
        public readonly int $id,
    ) {
    }
}

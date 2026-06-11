<?php

namespace App\Message;

/**
 * Demande de suppression asynchrone d'un objet R2 (binaire média/preuve).
 * La suppression est idempotente (R2 ignore les clés inexistantes).
 */
final class CleanupR2ObjectMessage
{
    public function __construct(public readonly string $storageKey)
    {
    }
}

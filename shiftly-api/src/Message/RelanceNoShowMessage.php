<?php

namespace App\Message;

/**
 * Planifie (différé, via DelayStamp) l'examen d'un no-show : à échéance, si la
 * réservation n'a pas été honorée, une relance BROUILLON est créée. Le déclenchement
 * ne dépend PAS de l'IA (seul le texte pré-rédigé en dépend).
 */
final class RelanceNoShowMessage
{
    public function __construct(public readonly int $reservationId)
    {
    }
}

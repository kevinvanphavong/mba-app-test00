<?php

namespace App\Exception;

/**
 * Levée quand le délai de prévenance IDCC 1790 n'est pas respecté
 * lors de la publication d'un planning hebdomadaire.
 *
 * - 7 jours calendaires : délai standard Convention Collective
 * - 3 jours calendaires : minimum exceptionnel
 */
class DelaiPrevenanceException extends \RuntimeException
{
    public function __construct(
        private readonly int $delaiJours
    ) {
        parent::__construct("Délai de prévenance non respecté : {$delaiJours} jour(s) calendaires.");
    }

    public function getDelaiJours(): int
    {
        return $this->delaiJours;
    }

    /** 'critique' si < 3j, 'attention' si entre 3 et 6j */
    public function getSeverity(): string
    {
        return $this->delaiJours < 3 ? 'critique' : 'attention';
    }
}

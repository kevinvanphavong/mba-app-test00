<?php

namespace App\Core\Ia\Exception;

use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Plafond IA mensuel du centre atteint : la demande est refusée AVANT tout appel
 * Mistral (coupe-circuit). Typée + mappée en 429 → refus propre côté client.
 */
final class IaQuotaDepasseException extends TooManyRequestsHttpException
{
    public function __construct(string $message = 'Plafond IA mensuel atteint pour ce centre.')
    {
        parent::__construct(retryAfter: null, message: $message);
    }
}

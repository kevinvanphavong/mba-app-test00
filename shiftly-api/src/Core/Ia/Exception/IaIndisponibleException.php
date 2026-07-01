<?php

namespace App\Core\Ia\Exception;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * L'IA ne peut pas servir la demande : non configurée, aucun centre courant
 * (fail-closed), ou erreur/timeout Mistral. Typée + mappée en 503 → jamais
 * d'exception nue (ni de détail Mistral) qui remonte au client.
 */
final class IaIndisponibleException extends ServiceUnavailableHttpException
{
    public function __construct(string $message = 'Service IA momentanément indisponible.', ?\Throwable $previous = null)
    {
        parent::__construct(retryAfter: null, message: $message, previous: $previous);
    }
}

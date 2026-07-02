<?php

namespace App\Exception;

/**
 * Conflit métier lors de l'onboarding d'un client : domaine déjà pris ou email
 * gérant déjà utilisé. Le contrôleur le traduit en HTTP 409 (aucune création partielle).
 */
final class ClientConflitException extends \RuntimeException
{
}

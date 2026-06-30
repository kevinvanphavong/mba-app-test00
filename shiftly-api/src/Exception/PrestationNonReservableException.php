<?php

namespace App\Exception;

/**
 * La prestation visée n'est pas réservable pour le centre résolu : inexistante,
 * inactive, ou — cas cross-tenant — appartenant à un autre centre. Le contrôleur
 * public la traduit en 404, sans révéler laquelle de ces causes s'applique.
 */
final class PrestationNonReservableException extends \RuntimeException
{
}

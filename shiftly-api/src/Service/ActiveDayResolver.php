<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Détermine le « jour actif » d'un centre à un instant T.
 *
 * Règle métier : entre 0h et 4h59 du matin, on est encore dans la journée
 * d'exploitation de la veille (service de nuit / fermeture tardive).
 * À partir de 5h, on bascule sur la journée du jour calendaire.
 *
 * Cette logique est la SOURCE DE VÉRITÉ unique côté backend. Toute fonction
 * qui détermine « le service du jour » DOIT passer par ce service.
 *
 * Le pendant frontend est `NIGHT_SHIFT_HOUR` dans `shiftly-app/src/lib/serviceUtils.ts`.
 * Les deux constantes DOIVENT rester synchronisées.
 */
class ActiveDayResolver
{
    /** Heure (0-23) à laquelle bascule le « jour actif » sur le jour calendaire suivant. */
    public const NIGHT_SHIFT_HOUR = 5;

    /** Timezone de référence pour tous les centres (Shiftly est franco-français pour l'instant). */
    private const TIMEZONE = 'Europe/Paris';

    /**
     * Retourne la date (à 00:00) du « jour actif » à l'instant donné.
     * `$now` est optionnel pour faciliter les tests (injection d'une date fixe).
     */
    public function getActiveDate(?\DateTimeImmutable $now = null): \DateTimeImmutable
    {
        $tz  = new \DateTimeZone(self::TIMEZONE);
        $now = $now ? $now->setTimezone($tz) : new \DateTimeImmutable('now', $tz);

        $reference = (int) $now->format('H') < self::NIGHT_SHIFT_HOUR
            ? $now->modify('-1 day')
            : $now;

        // On normalise à 00:00 dans la timezone Paris pour permettre une
        // comparaison d'égalité avec le champ `s.date` (DATE en BDD, sans heure).
        return $reference->setTime(0, 0, 0);
    }

    /** Variante string YYYY-MM-DD pour les payloads JSON exposés au front. */
    public function getActiveDateString(?\DateTimeImmutable $now = null): string
    {
        return $this->getActiveDate($now)->format('Y-m-d');
    }
}

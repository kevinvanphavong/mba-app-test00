<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\ActiveDayResolver;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Couverture du résolveur de jour actif :
 *  - basculement à 5h (Europe/Paris)
 *  - bornes 04:59:59 et 05:00:00
 *  - normalisation à 00:00:00
 *  - conversion correcte depuis UTC
 *  - changements d'heure été/hiver
 */
final class ActiveDayResolverTest extends TestCase
{
    private ActiveDayResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new ActiveDayResolver();
    }

    public function testReturnsYesterdayJustBeforeRolloverHour(): void
    {
        $now = new \DateTimeImmutable('2026-05-04 04:59:59', new \DateTimeZone('Europe/Paris'));
        self::assertSame('2026-05-03', $this->resolver->getActiveDateString($now));
    }

    public function testReturnsTodayExactlyAtRolloverHour(): void
    {
        $now = new \DateTimeImmutable('2026-05-04 05:00:00', new \DateTimeZone('Europe/Paris'));
        self::assertSame('2026-05-04', $this->resolver->getActiveDateString($now));
    }

    public function testReturnsYesterdayAtMidnight(): void
    {
        $now = new \DateTimeImmutable('2026-05-04 00:00:00', new \DateTimeZone('Europe/Paris'));
        self::assertSame('2026-05-03', $this->resolver->getActiveDateString($now));
    }

    public function testReturnsTodayAtNoon(): void
    {
        $now = new \DateTimeImmutable('2026-05-04 12:00:00', new \DateTimeZone('Europe/Paris'));
        self::assertSame('2026-05-04', $this->resolver->getActiveDateString($now));
    }

    public function testReturnsTodayJustBeforeMidnight(): void
    {
        $now = new \DateTimeImmutable('2026-05-04 23:59:59', new \DateTimeZone('Europe/Paris'));
        self::assertSame('2026-05-04', $this->resolver->getActiveDateString($now));
    }

    /**
     * 2026-05-04 03:30 UTC = 05:30 Paris (heure d'été UTC+2) → 4 mai
     * Vérifie que la conversion timezone est bien faite avant comparaison.
     */
    public function testConvertsUtcToParisBeforeComputing(): void
    {
        $nowUtc = new \DateTimeImmutable('2026-05-04 03:30:00', new \DateTimeZone('UTC'));
        self::assertSame('2026-05-04', $this->resolver->getActiveDateString($nowUtc));
    }

    /**
     * Passage à l'heure d'été : nuit du 28 au 29 mars 2026 (à 02:00 UTC = 03:00 Paris,
     * l'horloge saute à 03:00 → 04:00 Paris).
     * 2026-03-29 02:30 UTC = 04:30 Paris (heure d'été déjà active) → 28 mars.
     */
    public function testHandlesSpringDstTransition(): void
    {
        $nowUtc = new \DateTimeImmutable('2026-03-29 02:30:00', new \DateTimeZone('UTC'));
        self::assertSame('2026-03-28', $this->resolver->getActiveDateString($nowUtc));
    }

    /**
     * Passage à l'heure d'hiver : nuit du 24 au 25 octobre 2026.
     * 2026-10-25 03:30 UTC = 04:30 Paris (UTC+1 hiver) → 24 octobre.
     */
    public function testHandlesAutumnDstTransition(): void
    {
        $nowUtc = new \DateTimeImmutable('2026-10-25 03:30:00', new \DateTimeZone('UTC'));
        self::assertSame('2026-10-24', $this->resolver->getActiveDateString($nowUtc));
    }

    public function testReturnsDateAtMidnight(): void
    {
        $now    = new \DateTimeImmutable('2026-05-04 14:33:42', new \DateTimeZone('Europe/Paris'));
        $active = $this->resolver->getActiveDate($now);

        self::assertSame('00:00:00', $active->format('H:i:s'));
        self::assertSame('Europe/Paris', $active->getTimezone()->getName());
    }

    /**
     * Cohérence avec la conf serveur en UTC : même si date.timezone PHP est UTC,
     * le résolveur doit toujours répondre dans le référentiel Paris.
     */
    public function testIgnoresServerDefaultTimezone(): void
    {
        $previousTz = date_default_timezone_get();
        date_default_timezone_set('UTC');

        try {
            $now = new \DateTimeImmutable('2026-05-04 03:30:00', new \DateTimeZone('UTC'));
            self::assertSame('2026-05-04', $this->resolver->getActiveDateString($now));
        } finally {
            date_default_timezone_set($previousTz);
        }
    }
}

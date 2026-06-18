<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Constant\LegalThresholds;
use PHPUnit\Framework\TestCase;

/**
 * Verrouille les seuils légaux IDCC 1790 / Code du travail.
 * Toute modification de ces valeurs doit être un acte conscient (régression = test rouge).
 */
final class LegalThresholdsTest extends TestCase
{
    public function testSeuilsReglementaires(): void
    {
        self::assertSame(600, LegalThresholds::MAX_JOURNALIER_MINUTES, '10h/jour (Art. L3121-18)');
        self::assertSame(48, LegalThresholds::MAX_HEBDO_ABSOLU_HEURES, '48h/sem (Art. L3121-20)');
        self::assertSame(44, LegalThresholds::MAX_HEBDO_MOYENNE_HEURES, '44h moyenne 12 sem (Art. L3121-22)');
        self::assertSame(11, LegalThresholds::REPOS_QUOTIDIEN_HEURES, '11h repos quotidien (Art. L3131-1)');
        self::assertSame(35, LegalThresholds::REPOS_HEBDO_HEURES, '35h repos hebdo (Art. L3132-2)');
        self::assertSame(360, LegalThresholds::PAUSE_SEUIL_MINUTES, '6h avant pause (Art. L3121-16)');
        self::assertSame(20, LegalThresholds::PAUSE_MIN_MINUTES, '20 min de pause (Art. L3121-16)');
    }

    public function testBaseLegaleCouvreTousLesTypes(): void
    {
        foreach (['MAX_JOURNALIER', 'MAX_HEBDO_ABSOLU', 'MAX_HEBDO_MOYENNE', 'REPOS_QUOTIDIEN', 'REPOS_HEBDO', 'PAUSE_6H'] as $type) {
            self::assertArrayHasKey($type, LegalThresholds::BASE_LEGALE);
            self::assertStringContainsString('C. travail', LegalThresholds::BASE_LEGALE[$type]);
        }
    }
}

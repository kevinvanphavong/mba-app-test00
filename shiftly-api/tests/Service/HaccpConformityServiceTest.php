<?php

namespace App\Tests\Service;

use App\Entity\Completion;
use App\Entity\CompletionHaccpProof;
use App\Entity\Mission;
use App\Entity\MissionHaccpSpec;
use App\Service\HaccpConformityService;
use PHPUnit\Framework\TestCase;

/**
 * Non-régression des verdicts de conformité HACCP après extraction du listener.
 */
class HaccpConformityServiceTest extends TestCase
{
    private function proofWithSpec(?MissionHaccpSpec $spec): CompletionHaccpProof
    {
        $mission = $this->createStub(Mission::class);
        $mission->method('getHaccpSpec')->willReturn($spec);
        $completion = $this->createStub(Completion::class);
        $completion->method('getMission')->willReturn($mission);
        $proof = $this->createStub(CompletionHaccpProof::class);
        $proof->method('getCompletion')->willReturn($completion);

        return $proof;
    }

    private function tempSpec(?float $min, ?float $max): MissionHaccpSpec
    {
        $spec = $this->createStub(MissionHaccpSpec::class);
        $spec->method('getTypeReleve')->willReturn(MissionHaccpSpec::TYPE_TEMPERATURE);
        $spec->method('getEffectiveSeuils')->willReturn(['min' => $min, 'max' => $max]);

        return $spec;
    }

    public function testTemperatureDansLaPlageEstConforme(): void
    {
        $proof = $this->proofWithSpec($this->tempSpec(0.0, 4.0));
        $proof->method('getValeurNumerique')->willReturn(3.0);

        $this->assertTrue((new HaccpConformityService())->compute($proof));
    }

    public function testTemperatureSousLeMinEstNonConforme(): void
    {
        $proof = $this->proofWithSpec($this->tempSpec(0.0, 4.0));
        $proof->method('getValeurNumerique')->willReturn(-1.0);

        $this->assertFalse((new HaccpConformityService())->compute($proof));
    }

    public function testTemperatureAuDessusDuMaxEstNonConforme(): void
    {
        $proof = $this->proofWithSpec($this->tempSpec(0.0, 4.0));
        $proof->method('getValeurNumerique')->willReturn(9.0);

        $this->assertFalse((new HaccpConformityService())->compute($proof));
    }

    public function testTemperatureSansValeurEstNonApplicable(): void
    {
        $proof = $this->proofWithSpec($this->tempSpec(0.0, 4.0));
        $proof->method('getValeurNumerique')->willReturn(null);

        $this->assertNull((new HaccpConformityService())->compute($proof));
    }

    public function testPhotoEstNonApplicable(): void
    {
        $spec = $this->createStub(MissionHaccpSpec::class);
        $spec->method('getTypeReleve')->willReturn(MissionHaccpSpec::TYPE_PHOTO);
        $proof = $this->proofWithSpec($spec);

        $this->assertNull((new HaccpConformityService())->compute($proof));
    }

    public function testDlcFutureConformePasseeNonConforme(): void
    {
        $spec = $this->createStub(MissionHaccpSpec::class);
        $spec->method('getTypeReleve')->willReturn(MissionHaccpSpec::TYPE_DLC);

        $future = $this->proofWithSpec($spec);
        $future->method('getDateReleve')->willReturn(new \DateTimeImmutable('+5 days'));
        $this->assertTrue((new HaccpConformityService())->compute($future));

        $spec2 = $this->createStub(MissionHaccpSpec::class);
        $spec2->method('getTypeReleve')->willReturn(MissionHaccpSpec::TYPE_DLC);
        $past = $this->proofWithSpec($spec2);
        $past->method('getDateReleve')->willReturn(new \DateTimeImmutable('-5 days'));
        $this->assertFalse((new HaccpConformityService())->compute($past));
    }

    public function testSansSpecEstNonApplicable(): void
    {
        $this->assertNull((new HaccpConformityService())->compute($this->proofWithSpec(null)));
    }
}

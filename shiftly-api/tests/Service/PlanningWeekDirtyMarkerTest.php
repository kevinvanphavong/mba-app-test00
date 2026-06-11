<?php

namespace App\Tests\Service;

use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\Poste;
use App\Entity\Service;
use App\Service\PlanningWeekDirtyMarker;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\TestCase;

class PlanningWeekDirtyMarkerTest extends TestCase
{
    private function centre(int $id): Centre
    {
        $c = $this->createStub(Centre::class);
        $c->method('getId')->willReturn($id);

        return $c;
    }

    public function testKeyForPosteResoutLeLundiDeLaSemaine(): void
    {
        $service = $this->createStub(Service::class);
        $service->method('getCentre')->willReturn($this->centre(7));
        // mercredi 2026-06-10 → lundi 2026-06-08
        $service->method('getDate')->willReturn(new \DateTimeImmutable('2026-06-10'));
        $poste = $this->createStub(Poste::class);
        $poste->method('getService')->willReturn($service);

        $marker = new PlanningWeekDirtyMarker($this->createStub(Connection::class));
        $this->assertSame(['centreId' => 7, 'weekStart' => '2026-06-08'], $marker->keyFor($poste));
    }

    public function testKeyForAbsence(): void
    {
        $absence = $this->createStub(Absence::class);
        $absence->method('getCentre')->willReturn($this->centre(3));
        $absence->method('getDate')->willReturn(new \DateTimeImmutable('2026-06-08')); // lundi
        $marker = new PlanningWeekDirtyMarker($this->createStub(Connection::class));
        $this->assertSame(['centreId' => 3, 'weekStart' => '2026-06-08'], $marker->keyFor($absence));
    }

    public function testKeyForEntiteNonConcerneeEstNull(): void
    {
        $marker = new PlanningWeekDirtyMarker($this->createStub(Connection::class));
        $this->assertNull($marker->keyFor(new \stdClass()));
    }

    public function testMarkDirtyDedupliquePivotsParCentreEtSemaine(): void
    {
        $conn = $this->createMock(Connection::class);
        // 3 clés dont 2 identiques → 2 UPDATE seulement.
        $conn->expects($this->exactly(2))->method('executeStatement');

        (new PlanningWeekDirtyMarker($conn))->markDirty([
            ['centreId' => 1, 'weekStart' => '2026-06-08'],
            ['centreId' => 1, 'weekStart' => '2026-06-08'],
            ['centreId' => 2, 'weekStart' => '2026-06-08'],
        ]);
    }
}

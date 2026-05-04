<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Service;
use App\Service\ActiveDayResolver;
use App\Service\ServiceStatutResolver;
use PHPUnit\Framework\TestCase;

/**
 * Couverture des 3 transitions du résolveur de statut + cas TERMINE figé.
 * Le résolveur est testé en isolation avec un ActiveDayResolver vrai (pas de
 * mock) puisque celui-ci a déjà sa propre couverture.
 */
final class ServiceStatutResolverTest extends TestCase
{
    private ServiceStatutResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new ServiceStatutResolver(new ActiveDayResolver());
    }

    public function testReturnsPlanifieWhenServiceIsInTheFuture(): void
    {
        $service = $this->makeService('+3 days', Service::STATUT_PLANIFIE);
        self::assertSame(Service::STATUT_PLANIFIE, $this->resolver->resolve($service));
    }

    public function testReturnsEnCoursWhenServiceDateIsToday(): void
    {
        $today   = (new ActiveDayResolver())->getActiveDateString();
        $service = (new Service())
            ->setStatut(Service::STATUT_PLANIFIE)
            ->setDate(new \DateTimeImmutable($today));

        self::assertSame(Service::STATUT_EN_COURS, $this->resolver->resolve($service));
    }

    public function testReturnsTermineWhenServiceIsInThePast(): void
    {
        $service = $this->makeService('-2 days', Service::STATUT_PLANIFIE);
        self::assertSame(Service::STATUT_TERMINE, $this->resolver->resolve($service));
    }

    public function testRespectsManualTermineStatusEvenForFutureDate(): void
    {
        // Statut TERMINE posé manuellement → prioritaire sur la date
        $service = $this->makeService('+5 days', Service::STATUT_TERMINE);
        self::assertSame(Service::STATUT_TERMINE, $this->resolver->resolve($service));
    }

    private function makeService(string $relativeDate, string $statut): Service
    {
        return (new Service())
            ->setStatut($statut)
            ->setDate(new \DateTimeImmutable($relativeDate));
    }
}

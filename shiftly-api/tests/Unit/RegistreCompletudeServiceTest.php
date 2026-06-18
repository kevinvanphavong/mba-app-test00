<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\User;
use App\Service\RegistreCompletudeService;
use PHPUnit\Framework\TestCase;

final class RegistreCompletudeServiceTest extends TestCase
{
    public function testFicheVideRemonteTousLesChampsManquants(): void
    {
        $user = new User();
        $result = (new RegistreCompletudeService())->evaluer($user);

        self::assertSame(10, $result['total']);
        self::assertFalse($result['complet']);
        self::assertSame(0, $result['score']);
        self::assertCount(10, $result['manquants']);
    }

    public function testFicheCompleteEstConforme(): void
    {
        $user = (new User())
            ->setNom('Vallée')
            ->setPrenom('Erwan')
            ->setNomNaissance('Vallée')
            ->setDateNaissance(new \DateTimeImmutable('2000-03-04'))
            ->setSexe('M')
            ->setNationalite('Française')
            ->setNumeroSecuriteSociale('100039999999999')
            ->setEmploi('Hôte d\'accueil')
            ->setTypeContrat('CDI')
            ->setDateEmbauche(new \DateTimeImmutable('2022-01-01'));

        $result = (new RegistreCompletudeService())->evaluer($user);

        self::assertTrue($result['complet']);
        self::assertSame(10, $result['score']);
        self::assertSame([], $result['manquants']);
    }

    public function testChampVideOuBlancCompteCommeManquant(): void
    {
        $user = (new User())->setNom('Test')->setNationalite('   ');
        $result = (new RegistreCompletudeService())->evaluer($user);

        $champsManquants = array_column($result['manquants'], 'champ');
        self::assertContains('nationalite', $champsManquants, 'une chaîne blanche doit compter comme manquante');
        self::assertNotContains('nom', $champsManquants);
    }
}

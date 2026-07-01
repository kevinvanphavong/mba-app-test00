<?php

namespace App\Tests\Core\Ia;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Core\Ia\IaGenerator;
use App\Entity\Centre;
use App\Repository\IaQuotaRepository;
use App\Service\AiService;
use App\Service\CurrentCentreResolver;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\NullLogger;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;

/**
 * Core IA — quota par centre, coupe-circuit dur, journalisation, erreurs encapsulées.
 *
 * On mocke AiService (aucun appel Mistral réseau). Le centre courant est résolu par
 * le VRAI CurrentCentreResolver via le host de la requête (résolveur `final`, donc
 * non mockable — on pilote le host). Quota et journal sur la vraie base de test
 * (transaction DAMA rollback en fin de test).
 */
class IaGeneratorTest extends KernelTestCase
{
    private const PLAFOND = 3;
    private const HOST_A = 'ia-test-a.example';
    private const HOST_B = 'ia-test-b.example';

    private EntityManagerInterface $em;
    private Connection $db;
    private IaQuotaRepository $quotas;
    private CurrentCentreResolver $resolver;
    private Centre $centreA;
    private Centre $centreB;
    private string $periode;

    protected function setUp(): void
    {
        self::bootKernel();
        $c = static::getContainer();
        $this->em = $c->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $this->quotas = $c->get(IaQuotaRepository::class);
        $this->resolver = $c->get(CurrentCentreResolver::class);

        $ids = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $repo = $this->em->getRepository(Centre::class);
        $this->centreA = $repo->find($ids[0]);
        $this->centreB = $repo->find($ids[1]);
        $this->centreA->setDomaine(self::HOST_A);
        $this->centreB->setDomaine(self::HOST_B);
        $this->em->flush();
        $this->periode = (new \DateTimeImmutable())->format('Y-m');
    }

    private function visit(string $host): void
    {
        static::getContainer()->get('request_stack')->push(Request::create('http://'.$host.'/'));
    }

    private function makeGenerator(AiService $ai, int $plafond = self::PLAFOND, int $plafondPlateforme = self::PLAFOND): IaGenerator
    {
        return new IaGenerator(
            $ai,
            $this->resolver,
            $this->quotas,
            static::getContainer()->get(\App\Repository\PlateformeIaQuotaRepository::class),
            $this->em,
            new NullLogger(),
            $plafond,
            $plafondPlateforme,
        );
    }

    private function aiOk(?int $expectedCalls = null): AiService
    {
        // Sans comptage → stub (pas d'expectation) ; avec comptage → mock vérifié.
        if (null === $expectedCalls) {
            $ai = $this->createStub(AiService::class);
            $ai->method('isConfigured')->willReturn(true);
            $ai->method('ask')->willReturn('RÉPONSE IA');

            return $ai;
        }

        $ai = $this->createMock(AiService::class);
        $ai->method('isConfigured')->willReturn(true);
        $ai->expects($this->exactly($expectedCalls))->method('ask')->willReturn('RÉPONSE IA');

        return $ai;
    }

    private function appels(Centre $c): int
    {
        return (int) $this->db->fetchOne(
            'SELECT COALESCE(appels,0) FROM ia_quota WHERE centre_id = :c AND periode = :p',
            ['c' => $c->getId(), 'p' => $this->periode],
        );
    }

    private function journal(Centre $c): int
    {
        return (int) $this->db->fetchOne('SELECT count(*) FROM ia_usage WHERE centre_id = :c', ['c' => $c->getId()]);
    }

    public function testGenerateIncrementeCompteurEtJournaliseLeBonCentre(): void
    {
        $this->visit(self::HOST_A);
        $out = $this->makeGenerator($this->aiOk())->generate('Bonjour', ['usage' => 'test']);

        $this->assertSame('RÉPONSE IA', $out);
        $this->assertSame(1, $this->appels($this->centreA), 'Le compteur du centre doit être à 1.');
        $this->assertSame(1, $this->journal($this->centreA), 'La conso doit être journalisée.');
    }

    public function testPlafondAtteintRefuseSansAppelMistral(): void
    {
        $this->visit(self::HOST_A);
        // ask() ne doit être appelé QUE PLAFOND fois : le refus au-delà n'émet rien.
        $gen = $this->makeGenerator($this->aiOk(self::PLAFOND));

        for ($i = 0; $i < self::PLAFOND; ++$i) {
            $gen->generate("appel $i");
        }
        $this->assertSame(self::PLAFOND, $this->appels($this->centreA));

        $this->expectException(IaQuotaDepasseException::class);
        $gen->generate('appel de trop');
    }

    public function testConsoCentreANAffectePasCentreB(): void
    {
        $this->visit(self::HOST_A);
        $genA = $this->makeGenerator($this->aiOk());
        for ($i = 0; $i < self::PLAFOND; ++$i) {
            $genA->generate("A $i");
        }

        // Le centre B (autre host) garde tout son quota : sa génération passe.
        $this->visit(self::HOST_B);
        $out = $this->makeGenerator($this->aiOk())->generate('B');

        $this->assertSame('RÉPONSE IA', $out);
        $this->assertSame(self::PLAFOND, $this->appels($this->centreA));
        $this->assertSame(1, $this->appels($this->centreB));
    }

    public function testErreurMistralEncapsuleeEtQuotaLibere(): void
    {
        $this->visit(self::HOST_A);
        $ai = $this->createStub(AiService::class);
        $ai->method('isConfigured')->willReturn(true);
        $ai->method('ask')->willThrowException(new \RuntimeException('timeout Mistral brut'));

        try {
            $this->makeGenerator($ai)->generate('Bonjour');
            $this->fail('Une IaIndisponibleException était attendue.');
        } catch (IaIndisponibleException $e) {
            // L'erreur brute Mistral ne doit jamais fuiter dans le message client.
            $this->assertStringNotContainsString('timeout Mistral brut', $e->getMessage());
        }

        // Réservation libérée (la conso ne compte pas) et rien de journalisé.
        $this->assertSame(0, $this->appels($this->centreA));
        $this->assertSame(0, $this->journal($this->centreA));
    }

    public function testFailClosedSansCentreNAppellePasMistral(): void
    {
        $this->visit('host-sans-centre.invalid');
        $ai = $this->createMock(AiService::class);
        $ai->method('isConfigured')->willReturn(true);
        $ai->expects($this->never())->method('ask');

        $this->expectException(IaIndisponibleException::class);
        $this->makeGenerator($ai)->generate('Bonjour');
    }

    public function testGeneratePourPlateformeConsommeLeBudgetPlateformePasLeQuotaClient(): void
    {
        // Aucun centre visité : la génération plateforme ne dépend d'aucun centre.
        $out = $this->makeGenerator($this->aiOk())->generatePourPlateforme('Résume le mois.');

        $this->assertSame('RÉPONSE IA', $out);
        // Budget plateforme consommé…
        $plateforme = (int) $this->db->fetchOne('SELECT COALESCE(appels,0) FROM plateforme_ia_quota WHERE periode = :p', ['p' => $this->periode]);
        $this->assertSame(1, $plateforme);
        // …et AUCUN quota client entamé.
        $this->assertSame(0, $this->appels($this->centreA));
        $this->assertSame(0, $this->appels($this->centreB));
    }

    public function testGeneratePourPlateformePlafonnee(): void
    {
        $gen = $this->makeGenerator($this->aiOk(2), self::PLAFOND, 2); // plafond plateforme = 2
        $gen->generatePourPlateforme('1');
        $gen->generatePourPlateforme('2');

        $this->expectException(IaQuotaDepasseException::class);
        $gen->generatePourPlateforme('3');
    }
}

<?php

namespace App\Tests\Service;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Core\Ia\IaGeneratorInterface;
use App\Dto\CreateDemandeB2BInput;
use App\Entity\Centre;
use App\Entity\DemandeB2B;
use App\Service\DemandeB2BCreator;
use App\Service\DevisGenerator;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\NullLogger;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * B2B — la demande est toujours enregistrée d'abord ; le devis IA est best-effort.
 *
 * IaGeneratorInterface est mocké (aucun appel Mistral) ; demande/devis sur la vraie
 * base de test (transaction DAMA rollback).
 */
class DemandeB2BCreatorTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Connection $db;
    private Centre $centre;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $id = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $this->centre = $this->em->getRepository(Centre::class)->find($id);
    }

    private function makeCreator(IaGeneratorInterface $ia): DemandeB2BCreator
    {
        return new DemandeB2BCreator(
            $this->em,
            new DevisGenerator($ia, $this->em, new \App\Service\DevisLignesNormalizer()),
            static::getContainer()->get(\App\Service\CrmScheduler::class),
            new NullLogger(),
        );
    }

    private function input(): CreateDemandeB2BInput
    {
        $in = new CreateDemandeB2BInput();
        $in->nomContact = 'Alice Proctor';
        $in->email = 'ALICE@societe.fr';
        $in->telephone = '0601020304';
        $in->societe = 'ACME';
        $in->typeEvenement = 'Séminaire';
        $in->nbPersonnes = 20;
        $in->message = 'Devis pour un séminaire de 20 personnes.';

        return $in;
    }

    private function nbDevis(DemandeB2B $d): int
    {
        return (int) $this->db->fetchOne('SELECT count(*) FROM devis WHERE demande_id = :id', ['id' => $d->getId()]);
    }

    public function testDemandeCreeeAvecDevisBrouillonQuandIaOk(): void
    {
        $ia = $this->createStub(IaGeneratorInterface::class);
        $ia->method('generate')->willReturn(json_encode(['lignes' => [
            ['designation' => 'Salle', 'quantite' => 1, 'prixUnitaireCents' => 50000],
            ['designation' => 'Repas', 'quantite' => 20, 'prixUnitaireCents' => 2500],
        ]]));

        $demande = $this->makeCreator($ia)->create($this->centre, $this->input());

        $this->assertNotNull($demande->getId());
        $this->assertSame('alice@societe.fr', $demande->getEmail());
        $this->assertSame(1, $this->nbDevis($demande), 'Un devis brouillon doit être rattaché.');

        $row = $this->db->fetchAssociative('SELECT statut, total_cents, centre_id FROM devis WHERE demande_id = :id', ['id' => $demande->getId()]);
        $this->assertSame('BROUILLON', $row['statut']);
        $this->assertSame(100000, (int) $row['total_cents'], '1×50000 + 20×2500 = 100000 (figé serveur).');
        $this->assertSame($this->centre->getId(), (int) $row['centre_id']);
    }

    public function testQuotaIaDepasseGardeLaDemandeSansDevis(): void
    {
        $ia = $this->createStub(IaGeneratorInterface::class);
        $ia->method('generate')->willThrowException(new IaQuotaDepasseException());

        $demande = $this->makeCreator($ia)->create($this->centre, $this->input());

        $this->assertNotNull($demande->getId(), 'La demande doit être enregistrée malgré le quota IA.');
        $this->assertSame(0, $this->nbDevis($demande), 'Aucun devis quand le quota est atteint.');
    }

    public function testIaIndisponibleGardeLaDemandeSansDevis(): void
    {
        $ia = $this->createStub(IaGeneratorInterface::class);
        $ia->method('generate')->willThrowException(new IaIndisponibleException());

        $demande = $this->makeCreator($ia)->create($this->centre, $this->input());

        $this->assertNotNull($demande->getId());
        $this->assertSame(0, $this->nbDevis($demande));
    }
}

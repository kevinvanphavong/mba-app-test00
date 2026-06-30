<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Prestation;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Chantier 2 — Site public minimal résolu par domaine.
 *
 * Prouve : host connu → le bon centre + SES prestations actives (ordonnées) ;
 * host normalisé (casse / www.) ; host inconnu → 404 sans fuite ; aucune
 * prestation d'un autre centre ne transparaît ; le reste de l'API reste protégé.
 *
 * Données créées dans le test (transaction DAMA rollback en fin de test).
 */
class PublicSiteTest extends WebTestCase
{
    private const HOST_A = 'site-public-test-a.example';

    private KernelBrowser $client;
    private Connection $db;
    private int $centreA;
    private int $centreB;
    private string $nomA;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();

        // 2 centres distincts issus des fixtures.
        $ids = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $this->assertCount(2, $ids, 'Il faut au moins 2 centres en base de test.');
        [$this->centreA, $this->centreB] = $ids;

        $repoCentre = $em->getRepository(Centre::class);
        $a = $repoCentre->find($this->centreA);
        $b = $repoCentre->find($this->centreB);
        $a->setActif(true)->setDomaine(self::HOST_A);
        $this->nomA = $a->getNom();

        // Prestations du centre A : 2 actives (ordre volontairement inversé) + 1 inactive.
        $em->persist((new Prestation())->setCentre($a)->setNom('Laser game')->setDescription('Partie de 20 min')->setOrdre(2)->setActif(true));
        $em->persist((new Prestation())->setCentre($a)->setNom('Bowling')->setDescription('La piste à l\'heure')->setOrdre(1)->setActif(true));
        $em->persist((new Prestation())->setCentre($a)->setNom('Prestation masquée')->setOrdre(3)->setActif(false));

        // Prestation du centre B : ne doit JAMAIS apparaître sur le site de A.
        $em->persist((new Prestation())->setCentre($b)->setNom('Karaoké secret du centre B')->setOrdre(1)->setActif(true));

        $em->flush();
    }

    public function testHostConnuRenvoieLeBonCentreEtSesPrestationsActives(): void
    {
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => self::HOST_A]);

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertSame($this->nomA, $body['centre']);
        // Seules les 2 actives, triées par ordre croissant (Bowling avant Laser game).
        $this->assertSame(['Bowling', 'Laser game'], array_column($body['prestations'], 'nom'));
    }

    public function testHostNormaliseCasseEtWww(): void
    {
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => 'WWW.'.strtoupper(self::HOST_A)]);

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame($this->nomA, $body['centre']);
    }

    public function testAucunePrestationCrossTenant(): void
    {
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => self::HOST_A]);

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $noms = array_column($body['prestations'], 'nom');
        $this->assertNotContains('Karaoké secret du centre B', $noms, 'Aucune prestation d\'un autre centre ne doit fuiter.');
    }

    public function testHostInconnuRenvoie404(): void
    {
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => 'domaine-inexistant.invalid']);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode(), 'Host inconnu → 404, aucune fuite.');
    }

    public function testResteDeLApiProtegeSansJwt(): void
    {
        // Une route hors zone publique reste refusée sans authentification.
        $this->client->request('GET', '/api/zones', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertSame(401, $this->client->getResponse()->getStatusCode(), 'Le reste de l\'API doit rester protégé (401 sans JWT).');
    }
}

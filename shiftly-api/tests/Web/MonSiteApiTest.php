<?php

namespace App\Tests\Web;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * « Mon site » gérant : CRUD prestation (centre imposé serveur, prix ≥ 0) et contenu
 * de site reflété sur GET /api/public/site du bon centre, en texte simple assaini (#5).
 */
class MonSiteApiTest extends WebTestCase
{
    private const PASSWORD = 'mon-site-pass-2026';
    private const HOST = 'mon-site-test.example';

    private KernelBrowser $client;
    private Connection $db;
    private int $centreA;
    private int $centreB;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1');
        $user = $em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
        $this->centreA = (int) $user->getCentre()->getId();
        $user->getCentre()->setActif(true)->setDomaine(self::HOST);
        $em->flush();
        $this->centreB = (int) $this->db->fetchOne('SELECT id FROM centre WHERE id <> :a ORDER BY id LIMIT 1', ['a' => $this->centreA]);

        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::PASSWORD]));
        $this->assertResponseIsSuccessful('Login manager');
    }

    /** @param array<string, mixed> $body */
    private function post(string $path, array $body): int
    {
        $this->client->request('POST', $path, server: ['CONTENT_TYPE' => 'application/ld+json', 'HTTP_X-CSRF' => '1'], content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    public function testCreationPrestationRattacheeAuCentreDuManager(): void
    {
        // Le client tente d'imposer le centre B : doit être ignoré (centre = celui du JWT).
        $status = $this->post('/api/prestations', ['nom' => 'Nouvelle offre', 'prixCents' => 1500, 'actif' => true, 'ordre' => 1, 'centre' => "/api/centres/{$this->centreB}"]);
        $this->assertSame(201, $status);
        $body = json_decode($this->client->getResponse()->getContent(), true);

        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM prestation WHERE id = :id', ['id' => $body['id']]);
        $this->assertSame($this->centreA, $centreId, 'La prestation appartient au centre du manager, pas au centre falsifié.');
        $this->assertSame(1500, (int) $this->db->fetchOne('SELECT prix_cents FROM prestation WHERE id = :id', ['id' => $body['id']]));
    }

    public function testPrixNegatifRejete(): void
    {
        $this->assertSame(422, $this->post('/api/prestations', ['nom' => 'Négative', 'prixCents' => -100]));
    }

    public function testContenuSiteRefleteSurLeSitePublicEtAssaini(): void
    {
        // Le gérant édite le contenu avec une tentative d'injection HTML.
        $this->client->request('PATCH', "/api/centres/{$this->centreA}/update", server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: json_encode([
            'siteHeroTitre' => 'Bienvenue<script>alert(1)</script>',
            'siteDescription' => 'Notre <b>établissement</b>',
        ]));
        $this->assertResponseIsSuccessful();

        // Le site public (résolu par host) reflète le contenu, sans aucune balise.
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => self::HOST]);
        $this->assertResponseIsSuccessful();
        $raw = $this->client->getResponse()->getContent();
        $site = json_decode($raw, true);

        $this->assertSame('Bienvenuealert(1)', $site['heroTitre']);
        $this->assertSame('Notre établissement', $site['description']);
        $this->assertStringNotContainsString('<script>', $raw);
        $this->assertStringNotContainsString('<b>', $raw);
    }
}

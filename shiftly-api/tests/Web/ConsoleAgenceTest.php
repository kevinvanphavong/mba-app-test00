<?php

namespace App\Tests\Web;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Console agence — accès réservé super-admin, KPI cross-tenant, MRR, budget IA
 * plateforme distinct du quota client, lecture seule sur les données clients.
 */
class ConsoleAgenceTest extends WebTestCase
{
    private const PASSWORD = 'console-agence-pass-2026';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $this->hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
    }

    private function setPassword(string $role): string
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = :r AND actif = true ORDER BY id LIMIT 1', ['r' => $role]);
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, self::PASSWORD));
        $this->em->flush();

        return $email;
    }

    private function login(string $path, string $email): void
    {
        $this->client->request('POST', $path, server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::PASSWORD]));
        $this->assertResponseIsSuccessful('Login '.$email);
    }

    public function testManagerNePeutPasAccederALaConsole(): void
    {
        $this->login('/api/auth/login', $this->setPassword('MANAGER'));
        $this->client->request('GET', '/api/superadmin/console/kpis');
        $this->assertContains($this->client->getResponse()->getStatusCode(), [401, 403], 'Un manager ne doit pas atteindre la console.');
    }

    public function testAnonymeRefuse(): void
    {
        $this->client->request('GET', '/api/superadmin/console/kpis');
        $this->assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testSuperAdminVoitLesKpisEtMrrEgaleSommeAbonnements(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPassword('SUPERADMIN'));

        [$c1, $c2] = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $this->put("/api/superadmin/console/centres/$c1/abonnement", ['abonnementMensuelCents' => 9900]);
        $this->put("/api/superadmin/console/centres/$c2/abonnement", ['abonnementMensuelCents' => 14900]);

        $this->client->request('GET', '/api/superadmin/console/kpis');
        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);

        // MRR = somme des abonnements de TOUS les centres (les autres sont à 0).
        $sommeSql = (int) $this->db->fetchOne('SELECT COALESCE(SUM(abonnement_mensuel_cents),0) FROM centre');
        $this->assertSame($sommeSql, $body['global']['mrrCents']);
        $this->assertSame(24800, $sommeSql, '99,00 + 149,00 = 248,00 €.');
        $this->assertNotEmpty($body['centres']);
    }

    public function testResumeIaEndpointRepond(): void
    {
        // L'endpoint câble bien generatePourPlateforme (budget plateforme). La preuve
        // « n'entame pas le quota client » est faite au niveau IaGenerator (unité).
        $this->login('/api/superadmin/auth/login', $this->setPassword('SUPERADMIN'));
        $centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');

        $this->client->request('POST', "/api/superadmin/console/centres/$centreId/resume-ia", server: ['HTTP_X-CSRF' => '1']);
        $this->assertResponseIsSuccessful();
        $this->assertNotEmpty(json_decode($this->client->getResponse()->getContent(), true)['resume']);

        // Le quota du client n'a pas été journalisé par la console (lecture seule côté client).
        $this->assertSame(0, (int) $this->db->fetchOne('SELECT COALESCE(SUM(appels),0) FROM ia_quota WHERE centre_id = :c', ['c' => $centreId]));
    }

    public function testConsoleNeCreeAucuneDonneeClient(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPassword('SUPERADMIN'));
        $avant = (int) $this->db->fetchOne('SELECT COUNT(*) FROM reservation') + (int) $this->db->fetchOne('SELECT COUNT(*) FROM avis');

        $this->client->request('GET', '/api/superadmin/console/kpis');
        $centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $this->client->request('POST', "/api/superadmin/console/centres/$centreId/resume-ia", server: ['HTTP_X-CSRF' => '1']);

        $apres = (int) $this->db->fetchOne('SELECT COUNT(*) FROM reservation') + (int) $this->db->fetchOne('SELECT COUNT(*) FROM avis');
        $this->assertSame($avant, $apres, 'La console ne crée aucune donnée client (lecture seule).');
    }

    /** @param array<string, mixed> $body */
    private function put(string $path, array $body): void
    {
        $this->client->request('PUT', $path, server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: json_encode($body));
        $this->assertResponseIsSuccessful("PUT $path");
    }
}

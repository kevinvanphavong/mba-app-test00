<?php

namespace App\Tests\Web;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Plans de l'agence : CRUD réservé ROLE_SUPERADMIN, prix en centimes ≥ 0, assignation
 * à un centre qui DÉRIVE son abonnement (reflété au MRR de la console).
 */
class PlanApiTest extends WebTestCase
{
    private const SA_PW = 'plan-sa-pass-2026';
    private const MGR_PW = 'plan-mgr-pass-2026';

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

        $pool = static::getContainer()->get('cache.rate_limiter');
        if ($pool instanceof \Psr\Cache\CacheItemPoolInterface) {
            $pool->clear();
        }
    }

    private function setPw(string $role): string
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = :r AND actif = true ORDER BY id LIMIT 1', ['r' => $role]);
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, 'SUPERADMIN' === $role ? self::SA_PW : self::MGR_PW));
        $this->em->flush();

        return $email;
    }

    private function login(string $path, string $email, string $pw): void
    {
        $this->client->request('POST', $path, server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => $pw]));
        $this->assertResponseIsSuccessful('Login '.$email);
    }

    /** @param array<string, mixed> $body */
    private function req(string $method, string $path, array $body = [], string $ct = 'application/ld+json'): int
    {
        $this->client->request($method, $path, server: ['CONTENT_TYPE' => $ct, 'HTTP_ACCEPT' => 'application/ld+json', 'HTTP_X-CSRF' => '1'], content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    /** @return array<string, mixed> */
    private function body(): array
    {
        return json_decode($this->client->getResponse()->getContent(), true);
    }

    public function testSuperAdminCrudPlan(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPw('SUPERADMIN'), self::SA_PW);

        // Créer
        $this->assertSame(201, $this->req('POST', '/api/superadmin/plans', ['nom' => 'Pack Web', 'cle' => 'pack_web_test', 'prixMensuelCents' => 4900, 'actif' => true]));
        $id = $this->body()['id'];

        // Éditer (prix) via merge-patch
        $this->assertSame(200, $this->req('PATCH', "/api/superadmin/plans/$id", ['prixMensuelCents' => 5900], 'application/merge-patch+json'));
        $this->assertSame(5900, $this->body()['prixMensuelCents']);

        // Désactiver
        $this->assertSame(200, $this->req('PATCH', "/api/superadmin/plans/$id", ['actif' => false], 'application/merge-patch+json'));
        $this->assertFalse($this->body()['actif']);
    }

    public function testPrixNegatifBorneAZero(): void
    {
        // Prix négatif → borné à 0 côté serveur (setter max(0, …)) : jamais de prix négatif.
        $this->login('/api/superadmin/auth/login', $this->setPw('SUPERADMIN'), self::SA_PW);
        $this->assertSame(201, $this->req('POST', '/api/superadmin/plans', ['nom' => 'Négatif', 'cle' => 'neg_test', 'prixMensuelCents' => -100]));
        $this->assertSame(0, $this->body()['prixMensuelCents']);
    }

    public function testAssignerPlanDeriveAbonnementEtMrr(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPw('SUPERADMIN'), self::SA_PW);

        $this->assertSame(201, $this->req('POST', '/api/superadmin/plans', ['nom' => 'Pack Complet', 'cle' => 'pack_complet_test', 'prixMensuelCents' => 9900]));
        $planId = $this->body()['id'];
        $centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');

        // Assigner → l'abonnement du centre est dérivé du prix du plan.
        $this->assertSame(200, $this->req('PUT', "/api/superadmin/console/centres/$centreId/plan", ['planId' => $planId], 'application/json'));
        $this->assertSame(9900, (int) $this->db->fetchOne('SELECT abonnement_mensuel_cents FROM centre WHERE id = :i', ['i' => $centreId]));
        $this->assertSame($planId, (int) $this->db->fetchOne('SELECT plan_id FROM centre WHERE id = :i', ['i' => $centreId]));

        // Le MRR de la console reflète l'abonnement dérivé.
        $this->client->request('GET', '/api/superadmin/console/kpis');
        $mrr = $this->body()['global']['mrrCents'];
        $this->assertSame((int) $this->db->fetchOne('SELECT COALESCE(SUM(abonnement_mensuel_cents),0) FROM centre'), $mrr);

        // Détacher (planId null) → abonnement remis à 0.
        $this->assertSame(200, $this->req('PUT', "/api/superadmin/console/centres/$centreId/plan", ['planId' => null], 'application/json'));
        $this->assertSame(0, (int) $this->db->fetchOne('SELECT abonnement_mensuel_cents FROM centre WHERE id = :i', ['i' => $centreId]));
    }

    public function testManagerRefuseSurPlansEtAssignation(): void
    {
        $this->login('/api/auth/login', $this->setPw('MANAGER'), self::MGR_PW);
        $centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');

        $this->assertContains($this->req('GET', '/api/superadmin/plans'), [401, 403]);
        $this->assertContains($this->req('POST', '/api/superadmin/plans', ['nom' => 'X', 'cle' => 'x_test', 'prixMensuelCents' => 100]), [401, 403]);
        $this->assertContains($this->req('PUT', "/api/superadmin/console/centres/$centreId/plan", ['planId' => 1], 'application/json'), [401, 403]);
    }
}

<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Gestion d'un client par le super-admin : édition domaine (unique), suspension qui
 * COUPE l'accès (cockpit + public), reset mot de passe gérant. Réservé ROLE_SUPERADMIN.
 */
class SuperAdminGestionClientTest extends WebTestCase
{
    private const SA_PW = 'gestion-sa-pass-2026';
    private const MGR_PW = 'gestion-mgr-pass-2026';

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

        // Ce test enchaîne plusieurs logins (dont des échecs volontaires sur centre
        // suspendu) : on repart d'un limiteur anti-brute-force propre pour ne pas
        // hériter des compteurs d'autres tests (ni les leur laisser).
        $pool = static::getContainer()->get('cache.rate_limiter');
        if ($pool instanceof \Symfony\Contracts\Cache\CacheInterface || $pool instanceof \Psr\Cache\CacheItemPoolInterface) {
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

    private function login(string $path, string $email, string $pw): int
    {
        $this->client->request('POST', $path, server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => $pw]));

        return $this->client->getResponse()->getStatusCode();
    }

    /** @param array<string, mixed> $body */
    private function saRequest(string $method, string $path, array $body = []): int
    {
        $this->client->request($method, $path, server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    private function loginSuperAdmin(): void
    {
        $this->assertSame(200, $this->login('/api/superadmin/auth/login', $this->setPw('SUPERADMIN'), self::SA_PW));
    }

    public function testChangerDomaineEtConflit(): void
    {
        $this->loginSuperAdmin();
        [$a, $b] = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));

        // A prend un domaine « sale » → normalisé.
        $this->assertSame(200, $this->saRequest('PATCH', "/api/superadmin/centres/$a/domaine", ['domaine' => 'WWW.Gestion-A.FR:8080']));
        $this->assertSame('gestion-a.fr', $this->db->fetchOne('SELECT domaine FROM centre WHERE id = :i', ['i' => $a]));

        // B ne peut pas prendre le domaine de A → 409, pas d'écrasement.
        $this->assertSame(409, $this->saRequest('PATCH', "/api/superadmin/centres/$b/domaine", ['domaine' => 'gestion-a.fr']));
        $this->assertNotSame('gestion-a.fr', $this->db->fetchOne('SELECT domaine FROM centre WHERE id = :i', ['i' => $b]));
    }

    public function testSuspensionCoupeLeCockpitPuisReactivationRetablit(): void
    {
        $mgrEmail = $this->setPw('MANAGER');
        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE email = :e', ['e' => $mgrEmail]);

        $this->loginSuperAdmin();
        $this->assertSame(200, $this->saRequest('POST', "/api/superadmin/centres/$centreId/suspend"));

        // Cockpit coupé : le gérant ne peut plus se connecter (fail-closed user checker).
        $this->assertSame(401, $this->login('/api/auth/login', $mgrEmail, self::MGR_PW), 'Centre suspendu : login gérant refusé.');

        // Réactivation → le gérant se reconnecte.
        $this->loginSuperAdmin();
        $this->assertSame(200, $this->saRequest('POST', "/api/superadmin/centres/$centreId/reactivate"));
        $this->assertSame(200, $this->login('/api/auth/login', $mgrEmail, self::MGR_PW), 'Réactivé : login gérant rétabli.');
    }

    public function testSitePublicServiQuandActif(): void
    {
        $mgrEmail = $this->setPw('MANAGER');
        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE email = :e', ['e' => $mgrEmail]);

        $this->loginSuperAdmin();
        $this->assertSame(200, $this->saRequest('PATCH', "/api/superadmin/centres/$centreId/domaine", ['domaine' => 'actif-test.fr']));

        // GET avec Host custom en DERNIER (BrowserKit isole les cookies par host).
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => 'actif-test.fr']);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode(), 'Centre actif : site public servi.');
    }

    public function testSuspensionCoupeLeSitePublic(): void
    {
        $mgrEmail = $this->setPw('MANAGER');
        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE email = :e', ['e' => $mgrEmail]);

        $this->loginSuperAdmin();
        $this->assertSame(200, $this->saRequest('PATCH', "/api/superadmin/centres/$centreId/domaine", ['domaine' => 'suspendu-test.fr']));
        $this->assertSame(200, $this->saRequest('POST', "/api/superadmin/centres/$centreId/suspend"));

        // Site public du centre suspendu → 404 (GET custom-host en dernier).
        $this->client->request('GET', '/api/public/site', server: ['HTTP_HOST' => 'suspendu-test.fr']);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode(), 'Centre suspendu : site public coupé.');
    }

    public function testResetPasswordGerant(): void
    {
        $mgrEmail = $this->setPw('MANAGER');
        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE email = :e', ['e' => $mgrEmail]);

        $this->loginSuperAdmin();
        $nouveau = 'nouveau-mdp-456';
        $this->assertSame(200, $this->saRequest('POST', "/api/superadmin/centres/$centreId/reset-password", ['motDePasse' => $nouveau]));

        // La réponse ne contient jamais le mot de passe.
        $raw = $this->client->getResponse()->getContent();
        $this->assertStringNotContainsString($nouveau, $raw);

        // Le gérant (premier manager actif) se reconnecte avec le nouveau mot de passe.
        $resetEmail = json_decode($raw, true)['managerEmail'];
        $this->assertSame(200, $this->login('/api/auth/login', $resetEmail, $nouveau));
    }

    public function testNonSuperAdminRefuse(): void
    {
        $mgrEmail = $this->setPw('MANAGER');
        $centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE email = :e', ['e' => $mgrEmail]);
        $this->login('/api/auth/login', $mgrEmail, self::MGR_PW);

        foreach ([
            ['PATCH', "/api/superadmin/centres/$centreId/domaine", ['domaine' => 'x.fr']],
            ['POST', "/api/superadmin/centres/$centreId/reset-password", ['motDePasse' => 'aaaaaaaa']],
            ['POST', "/api/superadmin/centres/$centreId/suspend", []],
        ] as [$m, $p, $b]) {
            $this->assertContains($this->saRequest($m, $p, $b), [401, 403], "$m $p doit être refusé au manager.");
        }
    }
}

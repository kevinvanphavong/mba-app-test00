<?php

namespace App\Tests\Web;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Journal d'activité super-admin : agrégation AuditLog + EventLog triée par date,
 * filtres (centre/type), pagination, LECTURE SEULE, réservé ROLE_SUPERADMIN.
 */
class SuperAdminActivityTest extends WebTestCase
{
    private const SA_PW = 'activity-sa-pass-2026';
    private const MGR_PW = 'activity-mgr-pass-2026';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;
    private int $centreA;
    private int $centreB;

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

        [$this->centreA, $this->centreB] = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $saId = (int) $this->db->fetchOne('SELECT id FROM "user" WHERE role = \'SUPERADMIN\' AND actif = true ORDER BY id LIMIT 1');

        // Seed déterministe : 2 actions super-admin (audit) + 1 événement métier (event).
        $this->db->executeStatement(
            "INSERT INTO audit_log (action, target_type, target_id, metadata, created_at, super_admin_user_id)
             VALUES ('CENTRE_SUSPEND', 'centre', :c, '{}', '2030-01-03 10:00:00', :sa)",
            ['c' => $this->centreA, 'sa' => $saId]
        );
        $this->db->executeStatement(
            "INSERT INTO audit_log (action, target_type, target_id, metadata, created_at, super_admin_user_id)
             VALUES ('CENTRE_DOMAINE_CHANGE', 'centre', :c, '{}', '2030-01-02 10:00:00', :sa)",
            ['c' => $this->centreB, 'sa' => $saId]
        );
        $this->db->executeStatement(
            "INSERT INTO event_log (entity_type, entity_id, action, payload, occurred_at, centre_id)
             VALUES ('reservation', 42, 'RESA_CONFIRMEE', '{}', '2030-01-03 09:00:00', :c)",
            ['c' => $this->centreA]
        );
    }

    private function loginSuperAdmin(): void
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = \'SUPERADMIN\' AND actif = true ORDER BY id LIMIT 1');
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, self::SA_PW));
        $this->em->flush();
        $this->client->request('POST', '/api/superadmin/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::SA_PW]));
        $this->assertResponseIsSuccessful('Login super-admin');
    }

    /** @return array<string, mixed> */
    private function get(string $qs = ''): array
    {
        $this->client->request('GET', '/api/superadmin/activity'.$qs);
        $this->assertResponseIsSuccessful();

        return json_decode($this->client->getResponse()->getContent(), true);
    }

    public function testAggregeLesDeuxSourcesTrieesParDate(): void
    {
        $this->loginSuperAdmin();
        $body = $this->get('?from=2030-01-01&to=2030-01-31');

        // Les 3 seeds sont présents (2 audit + 1 event), rien d'autre sur cette période.
        $this->assertSame(3, $body['total']);
        $sources = array_column($body['items'], 'source');
        $this->assertContains('audit', $sources);
        $this->assertContains('event', $sources);

        // Tri par date décroissante.
        $dates = array_column($body['items'], 'date');
        $trie = $dates;
        rsort($trie);
        $this->assertSame($trie, $dates);
    }

    public function testFiltreParCentreNeFuitPas(): void
    {
        $this->loginSuperAdmin();
        $body = $this->get('?from=2030-01-01&to=2030-01-31&centre='.$this->centreA);

        // Centre A : 1 audit + 1 event. Aucun item d'un autre centre.
        $this->assertSame(2, $body['total']);
        foreach ($body['items'] as $item) {
            $this->assertSame($this->centreA, $item['centreId'], 'Le filtre centre ne doit renvoyer que ce centre.');
        }
    }

    public function testFiltreTypeEtPagination(): void
    {
        $this->loginSuperAdmin();

        // Type
        $body = $this->get('?from=2030-01-01&to=2030-01-31&type=CENTRE_SUSPEND');
        $this->assertSame(1, $body['total']);
        $this->assertSame('CENTRE_SUSPEND', $body['items'][0]['type']);

        // Pagination : 1 par page → page 1 ≠ page 2.
        $p1 = $this->get('?from=2030-01-01&to=2030-01-31&perPage=1&page=1');
        $p2 = $this->get('?from=2030-01-01&to=2030-01-31&perPage=1&page=2');
        $this->assertCount(1, $p1['items']);
        $this->assertCount(1, $p2['items']);
        $this->assertNotSame($p1['items'][0]['date'], $p2['items'][0]['date']);
    }

    public function testNonSuperAdminRefuse(): void
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1');
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, self::MGR_PW));
        $this->em->flush();
        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::MGR_PW]));

        $this->client->request('GET', '/api/superadmin/activity');
        $this->assertContains($this->client->getResponse()->getStatusCode(), [401, 403]);
    }
}

<?php

namespace App\Tests\Web;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Onboarding client par le super-admin : création complète (centre + domaine + gérant
 * + abonnement) réservée ROLE_SUPERADMIN, domaine unique (409 sans création partielle),
 * gérant isolé sur son seul centre.
 */
class ClientOnboardingTest extends WebTestCase
{
    private const PASSWORD = 'onboarding-pass-2026';
    private const MANAGER_PW = 'gerant-initial-123';

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

    private function login(string $path, string $email, string $pw = self::PASSWORD): void
    {
        $this->client->request('POST', $path, server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => $pw]));
        $this->assertResponseIsSuccessful('Login '.$email);
    }

    /** @param array<string, mixed> $body */
    private function creer(array $body): int
    {
        $this->client->request('POST', '/api/superadmin/console/centres', server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    /** @return array<string, mixed> */
    private function payload(string $domaine, string $email): array
    {
        return [
            'nom' => 'Nouveau Client Test',
            'domaine' => $domaine,
            'managerNom' => 'Gérant Test',
            'managerEmail' => $email,
            'managerMotDePasse' => self::MANAGER_PW,
            'abonnementMensuelCents' => 29900,
        ];
    }

    public function testSuperAdminCreeUnClientCompletEtIsole(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPassword('SUPERADMIN'));

        // Domaine « sale » (majuscules + www + port) → doit être normalisé côté serveur.
        $status = $this->creer($this->payload('WWW.Onboarding-Test.FR:8080', 'gerant-onboarding@test.fr'));
        $this->assertSame(201, $status, (string) $this->client->getResponse()->getContent());
        $body = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertSame('onboarding-test.fr', $body['domaine'], 'Domaine normalisé (minuscules, sans www/port).');
        $this->assertSame(29900, $body['abonnementMensuelCents']);
        $centreId = $body['id'];

        // Gérant MANAGER rattaché au nouveau centre, mot de passe hashé (pas en clair).
        $row = $this->db->fetchAssociative('SELECT centre_id, role, password FROM "user" WHERE email = :e', ['e' => 'gerant-onboarding@test.fr']);
        $this->assertSame($centreId, (int) $row['centre_id']);
        $this->assertSame('MANAGER', $row['role']);
        $this->assertNotSame(self::MANAGER_PW, $row['password'], 'Le mot de passe est hashé.');

        // Le gérant peut se connecter et n'accède qu'à SON centre (collection vide, 200).
        $this->login('/api/auth/login', 'gerant-onboarding@test.fr', self::MANAGER_PW);
        $this->client->request('GET', '/api/reservations', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertResponseIsSuccessful();
    }

    public function testDomaineDejaPrisRefuseSansCreationPartielle(): void
    {
        $this->login('/api/superadmin/auth/login', $this->setPassword('SUPERADMIN'));
        $this->assertSame(201, $this->creer($this->payload('onboarding-dup.fr', 'gerant-dup-1@test.fr')));

        $centresAvant = (int) $this->db->fetchOne('SELECT COUNT(*) FROM centre');

        // Même domaine, autre email → 409, et AUCUNE création partielle.
        $this->assertSame(409, $this->creer($this->payload('onboarding-dup.fr', 'gerant-dup-2@test.fr')));
        $this->assertSame($centresAvant, (int) $this->db->fetchOne('SELECT COUNT(*) FROM centre'), 'Aucun centre créé sur conflit.');
        $this->assertSame(0, (int) $this->db->fetchOne('SELECT COUNT(*) FROM "user" WHERE email = :e', ['e' => 'gerant-dup-2@test.fr']), 'Aucun gérant orphelin créé.');
    }

    public function testManagerNePeutPasCreer(): void
    {
        $this->login('/api/auth/login', $this->setPassword('MANAGER'));
        $this->assertContains($this->creer($this->payload('interdit-manager.fr', 'x@test.fr')), [401, 403]);
    }

    public function testAnonymeRefuse(): void
    {
        $this->assertContains($this->creer($this->payload('interdit-anon.fr', 'y@test.fr')), [401, 403]);
    }
}

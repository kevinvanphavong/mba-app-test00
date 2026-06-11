<?php

namespace App\Tests\Validation;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Palier 4 — la création d'absence (endpoint custom) valide côté serveur :
 * type hors liste et motif trop long → 422 normalisé avec le champ fautif.
 */
class AbsenceValidationTest extends WebTestCase
{
    private const PASSWORD = 'absence-val-pass-2026';

    private KernelBrowser $client;
    private string $managerEmail;
    private int $employeeId;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $em = $container->get(EntityManagerInterface::class);
        /** @var Connection $db */
        $db = $em->getConnection();
        $hasher = $container->get(UserPasswordHasherInterface::class);

        // Un centre avec un manager actif ET au moins un autre user (l'employé visé).
        $centreId = (int) $db->fetchOne(
            'SELECT c.id FROM centre c
             JOIN "user" m ON m.centre_id = c.id AND m.role = \'MANAGER\' AND m.actif = true
             WHERE (SELECT count(*) FROM "user" u WHERE u.centre_id = c.id) >= 2
             ORDER BY c.id LIMIT 1'
        );
        $this->managerEmail = $db->fetchOne(
            'SELECT email FROM "user" WHERE centre_id = :c AND role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1',
            ['c' => $centreId]
        );
        $this->employeeId = (int) $db->fetchOne(
            'SELECT id FROM "user" WHERE centre_id = :c AND email <> :e ORDER BY id LIMIT 1',
            ['c' => $centreId, 'e' => $this->managerEmail]
        );

        $manager = $em->getRepository(User::class)->findOneBy(['email' => $this->managerEmail]);
        $manager->setPassword($hasher->hashPassword($manager, self::PASSWORD));
        $em->flush();

        $this->login();
    }

    public function testCreationNominaleEst201(): void
    {
        $this->postAbsence(['userId' => $this->employeeId, 'date' => '2030-01-15', 'type' => 'CP', 'motif' => 'Vacances']);
        $this->assertSame(201, $this->client->getResponse()->getStatusCode());
    }

    public function testTypeInvalideEst422AvecLeChampType(): void
    {
        $this->postAbsence(['userId' => $this->employeeId, 'date' => '2030-02-15', 'type' => 'PAS_UN_TYPE']);
        $this->assertSame(422, $this->client->getResponse()->getStatusCode());
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('type', $body['errors'] ?? []);
    }

    public function testMotifTropLongEst422AvecLeChampMotif(): void
    {
        $this->postAbsence([
            'userId' => $this->employeeId,
            'date' => '2030-03-15',
            'type' => 'AUTRE',
            'motif' => str_repeat('x', 256),
        ]);
        $this->assertSame(422, $this->client->getResponse()->getStatusCode());
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('motif', $body['errors'] ?? []);
    }

    /** @param array<string, mixed> $payload */
    private function postAbsence(array $payload): void
    {
        $this->client->request(
            'POST',
            '/api/planning/absence',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'],
            content: json_encode($payload),
        );
    }

    private function login(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $this->managerEmail, 'password' => self::PASSWORD]),
        );
        $this->assertResponseIsSuccessful();
    }
}

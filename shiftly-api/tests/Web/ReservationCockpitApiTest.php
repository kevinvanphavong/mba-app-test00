<?php

namespace App\Tests\Web;

use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * API gérant Réservations (cockpit) : réservée MANAGER, EMPLOYE/anonyme refusés,
 * et aucune donnée sensible (id de session Stripe) exposée.
 */
class ReservationCockpitApiTest extends WebTestCase
{
    private const PASSWORD = 'cockpit-resa-pass-2026';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;
    private int $centre;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $this->hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $this->centre = (int) $this->db->fetchOne(
            'SELECT centre_id FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1'
        );
    }

    private function loginRole(string $role): void
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = :r AND actif = true ORDER BY id LIMIT 1', ['r' => $role]);
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, self::PASSWORD));
        $this->em->flush();

        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::PASSWORD]));
        $this->assertResponseIsSuccessful('Login '.$role);
    }

    private function seedReservation(): void
    {
        $centre = $this->em->getRepository(\App\Entity\Centre::class)->find($this->centre);
        $presta = (new Prestation())->setCentre($centre)->setNom('Bowling')->setPrixCents(2000)->setActif(true);
        $resa = (new Reservation())->setCentre($centre)->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-06-15 18:00'))->setNbPersonnes(3)
            ->setNomInvite('Jean Invité')->setEmailInvite('jean@example.com')->setTelephoneInvite('0601020304')
            ->setMontantTotalCents(6000)->setAcompteCents(1200)->setStripeSessionId('cs_test_SECRET');
        $this->em->persist($presta);
        $this->em->persist($resa);
        $this->em->flush();
    }

    public function testAnonymeRefuse(): void
    {
        $this->client->request('GET', '/api/reservations', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testEmployeRefuse(): void
    {
        $this->loginRole('EMPLOYE');
        $this->client->request('GET', '/api/reservations', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertSame(403, $this->client->getResponse()->getStatusCode(), 'Un employé ne pilote pas les réservations.');
    }

    public function testManagerVoitSesReservationsSansDonneeStripe(): void
    {
        $this->seedReservation();
        $this->loginRole('MANAGER');

        $this->client->request('GET', '/api/reservations', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertResponseIsSuccessful();
        $raw = $this->client->getResponse()->getContent();
        $body = json_decode($raw, true);

        $this->assertGreaterThanOrEqual(1, $body['totalItems'] ?? $body['hydra:totalItems'] ?? 0);
        // Champs métier exposés, mais JAMAIS l'id de session Stripe.
        $this->assertStringContainsString('acompteCents', $raw);
        $this->assertStringContainsString('prestationNom', $raw);
        $this->assertStringNotContainsString('stripeSessionId', $raw);
        $this->assertStringNotContainsString('cs_test_SECRET', $raw);
    }
}

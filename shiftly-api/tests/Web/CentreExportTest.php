<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Entity\User;
use App\Message\LogAuditEventMessage;
use App\Service\CentreExportService;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Export RGPD d'un centre : archive ZIP réservée ROLE_SUPERADMIN, PII déchiffrées,
 * strictement le centre ciblé (zéro fuite cross-tenant), action tracée dans l'audit.
 */
class CentreExportTest extends WebTestCase
{
    private const SA_PW = 'export-sa-pass-2026';
    private const MGR_PW = 'export-mgr-pass-2026';

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
        $this->seed($this->centreA, 'Alice Export', 'alice-export@test.fr');
        $this->seed($this->centreB, 'Bob Autre', 'bob-autre@test.fr');
    }

    private function seed(int $centreId, string $nom, string $email): void
    {
        $centre = $this->em->getRepository(Centre::class)->find($centreId);
        $contact = (new Contact())->setCentre($centre)->setNom($nom)->setEmail($email)
            ->setEmailHash('h-'.$centreId.'-'.$email)->setSegments([Contact::SEGMENT_B2C]);
        $presta = (new Prestation())->setCentre($centre)->setNom('Presta '.$centreId)->setPrixCents(2000)->setActif(true);
        $resa = (new Reservation())->setCentre($centre)->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-05-01 18:00'))->setNbPersonnes(2)
            ->setNomInvite($nom)->setEmailInvite($email)->setTelephoneInvite('0600000000')
            ->setMontantTotalCents(4000)->setAcompteCents(800);
        $this->em->persist($contact);
        $this->em->persist($presta);
        $this->em->persist($resa);
        $this->em->flush();
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

    public function testArchiveContientToutesLesEntitesPiiDechiffreesSansFuite(): void
    {
        $service = static::getContainer()->get(CentreExportService::class);
        $centre = $this->em->getRepository(Centre::class)->find($this->centreA);
        $path = $service->archive($centre);

        try {
            $zip = new \ZipArchive();
            $this->assertTrue(true === $zip->open($path), 'Archive ZIP ouvrable.');
            // Toutes les entités présentes.
            foreach (['export.json', 'prestations.csv', 'reservations.csv', 'contacts.csv', 'demandesB2B.csv', 'devis.csv', 'avis.csv'] as $f) {
                $this->assertNotFalse($zip->locateName($f), "Fichier manquant : $f");
            }
            $data = json_decode((string) $zip->getFromName('export.json'), true);
            $zip->close();
        } finally {
            @unlink($path);
        }

        $raw = json_encode($data);
        // PII du centre A déchiffrées ; AUCUNE donnée du centre B.
        $this->assertStringContainsString('Alice Export', $raw);
        $this->assertStringContainsString('alice-export@test.fr', $raw);
        $this->assertStringNotContainsString('Bob Autre', $raw);
        $this->assertStringNotContainsString('bob-autre@test.fr', $raw);

        foreach (['centre', 'prestations', 'reservations', 'contacts', 'demandesB2B', 'devis', 'avis'] as $k) {
            $this->assertArrayHasKey($k, $data);
        }
        $this->assertSame('Alice Export', $data['contacts'][0]['nom']);
        $this->assertSame($this->centreA, $data['centre']['id']);
    }

    public function testEndpointRenvoieUnZipTraceDansLAudit(): void
    {
        $this->loginSuperAdmin();

        $this->client->request('GET', "/api/superadmin/centres/{$this->centreA}/export");
        $this->assertResponseIsSuccessful();
        $this->assertInstanceOf(BinaryFileResponse::class, $this->client->getResponse());
        $this->assertSame('application/zip', $this->client->getResponse()->headers->get('Content-Type'));

        // L'audit CENTRE_EXPORT est dispatché (transport async in-memory en test) AVANT l'envoi.
        $transport = static::getContainer()->get('messenger.transport.async');
        $audits = array_filter(
            array_map(static fn ($env) => $env->getMessage(), $transport->getSent()),
            fn (object $m): bool => $m instanceof LogAuditEventMessage && 'CENTRE_EXPORT' === $m->action && $this->centreA === $m->targetId,
        );
        $this->assertNotEmpty($audits, 'Chaque export trace une action CENTRE_EXPORT du bon centre.');
    }

    public function testNonSuperAdminRefuse(): void
    {
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1');
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($this->hasher->hashPassword($user, self::MGR_PW));
        $this->em->flush();
        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::MGR_PW]));

        $this->client->request('GET', "/api/superadmin/centres/{$this->centreA}/export");
        $this->assertContains($this->client->getResponse()->getStatusCode(), [401, 403]);
    }

    public function testAnonymeRefuse(): void
    {
        $this->client->request('GET', "/api/superadmin/centres/{$this->centreA}/export");
        $this->assertContains($this->client->getResponse()->getStatusCode(), [401, 403]);
    }
}

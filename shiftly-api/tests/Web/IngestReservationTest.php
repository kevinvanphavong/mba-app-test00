<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Ingestion machine-to-machine des réservations (^/api/ingest) : clé API de centre,
 * création 201, idempotence 200, clé absente/inconnue 401, payload invalide 422,
 * réservation TOUJOURS rattachée au centre de la clé.
 */
class IngestReservationTest extends WebTestCase
{
    private const KEY = 'ingest-test-key-abc123';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private int $centreId;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();

        $pool = static::getContainer()->get('cache.rate_limiter');
        if ($pool instanceof \Psr\Cache\CacheItemPoolInterface) {
            $pool->clear();
        }

        $this->centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $centre = $this->em->getRepository(Centre::class)->find($this->centreId);
        $centre->setIngestKey(self::KEY);
        $this->em->flush();
    }

    /** @param array<string, mixed> $body */
    private function post(?string $key, array $body): int
    {
        $server = ['CONTENT_TYPE' => 'application/json'];
        if (null !== $key) {
            $server['HTTP_X-Shiftly-Ingest-Key'] = $key;
        }
        $this->client->request('POST', '/api/ingest/reservations', server: $server, content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    /** @return array<string, mixed> */
    private function payload(string $sourceRef): array
    {
        return [
            'sourceRef' => $sourceRef,
            'source' => 'fgc-web',
            'type' => 'anniversaire',
            'dateCreneau' => '2026-07-20T14:00:00+02:00',
            'nbPersonnes' => 8,
            'client' => ['nom' => 'Dupont', 'email' => 'p.dupont@example.com', 'telephone' => '0600000000'],
            'formule' => 'super-bowler',
            'montantTotalCents' => 16000,
            'statut' => 'confirme',
        ];
    }

    public function testIngestCreeUneResaRattacheeAuCentreDeLaCle(): void
    {
        $this->assertSame(201, $this->post(self::KEY, $this->payload('ANNIV-2026-000123')));
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($body['created']);

        $row = $this->db->fetchAssociative('SELECT centre_id, source, statut, formule, nom_invite FROM reservation WHERE source_ref = :r', ['r' => 'ANNIV-2026-000123']);
        $this->assertSame($this->centreId, (int) $row['centre_id'], 'La résa est rattachée au centre de la clé.');
        $this->assertSame('fgc-web', $row['source']);
        $this->assertSame('CONFIRMEE', $row['statut']);
        $this->assertSame('super-bowler', $row['formule']);
        $this->assertSame('Dupont', $row['nom_invite']);
    }

    public function testRejeuMemeSourceRefEstIdempotent(): void
    {
        $this->assertSame(201, $this->post(self::KEY, $this->payload('ANNIV-DUP-1')));
        $this->assertSame(200, $this->post(self::KEY, $this->payload('ANNIV-DUP-1')), 'Rejeu → 200 (déjà ingéré).');

        $this->assertSame(1, (int) $this->db->fetchOne('SELECT COUNT(*) FROM reservation WHERE centre_id = :c AND source_ref = :r', ['c' => $this->centreId, 'r' => 'ANNIV-DUP-1']));
    }

    public function testCleAbsenteOuInconnueRefusee(): void
    {
        $this->assertSame(401, $this->post(null, $this->payload('X-1')), 'Clé absente → 401.');
        $this->assertSame(401, $this->post('cle-bidon-inconnue', $this->payload('X-2')), 'Clé inconnue → 401.');
        $this->assertSame(0, (int) $this->db->fetchOne("SELECT COUNT(*) FROM reservation WHERE source_ref IN ('X-1','X-2')"));
    }

    public function testPayloadInvalideRejete(): void
    {
        $bad = $this->payload('BAD-1');
        $bad['nbPersonnes'] = 0;                 // < 1
        $bad['client']['email'] = 'pas-un-email'; // email cassé
        $this->assertSame(422, $this->post(self::KEY, $bad));

        $noRef = $this->payload('');
        $noRef['sourceRef'] = '';                 // sourceRef vide
        $this->assertSame(422, $this->post(self::KEY, $noRef));
    }
}

<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * CRM — dépôt public d'un avis (POST /api/public/avis), centre résolu par host.
 * Prouve : avis créé pour le bon centre (NOUVEAU) ; host inconnu → 404 ; note validée.
 */
class PublicAvisTest extends WebTestCase
{
    private const HOST_A = 'avis-test-a.example';

    private KernelBrowser $client;
    private Connection $db;
    private int $centreA;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();
        $this->centreA = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $a = $em->getRepository(Centre::class)->find($this->centreA);
        $a->setActif(true)->setDomaine(self::HOST_A);
        $em->flush();
    }

    /** @param array<string, mixed> $payload */
    private function post(array $payload, string $host = self::HOST_A): int
    {
        $this->client->request('POST', '/api/public/avis', server: ['CONTENT_TYPE' => 'application/json', 'HTTP_HOST' => $host], content: json_encode($payload));

        return $this->client->getResponse()->getStatusCode();
    }

    public function testAvisCreePourLeBonCentre(): void
    {
        $this->assertSame(201, $this->post(['note' => 5, 'commentaire' => 'Super soirée !']));
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $row = $this->db->fetchAssociative('SELECT centre_id, statut, note FROM avis WHERE id = :id', ['id' => $body['id']]);
        $this->assertSame($this->centreA, (int) $row['centre_id']);
        $this->assertSame('NOUVEAU', $row['statut']);
        $this->assertSame(5, (int) $row['note']);
    }

    public function testHostInconnu404(): void
    {
        $this->assertSame(404, $this->post(['note' => 4], 'inconnu.invalid'));
    }

    public function testNoteInvalide422(): void
    {
        $this->assertSame(422, $this->post(['note' => 9]));
    }
}

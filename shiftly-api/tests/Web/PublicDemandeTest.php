<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * B2B — dépôt public d'une demande (POST /api/public/demandes), centre résolu par host.
 *
 * IA déterministe (FakeIaGenerator en env test) : un devis brouillon est généré.
 * Prouve : demande créée pour le BON centre + devis brouillon rattaché ; host inconnu
 * → 404 ; validation des champs ; devis jamais « envoyé » (reste BROUILLON).
 */
class PublicDemandeTest extends WebTestCase
{
    private const HOST_A = 'demande-b2b-test-a.example';

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
        $this->client->request(
            'POST',
            '/api/public/demandes',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_HOST' => $host],
            content: json_encode($payload),
        );

        return $this->client->getResponse()->getStatusCode();
    }

    /** @return array<string, mixed> */
    private function validPayload(): array
    {
        return [
            'nomContact' => 'Alice Proctor',
            'email' => 'alice@societe.fr',
            'telephone' => '0601020304',
            'societe' => 'ACME',
            'typeEvenement' => 'Séminaire',
            'nbPersonnes' => 20,
            'message' => 'Nous cherchons un devis pour un séminaire.',
        ];
    }

    public function testDemandeCreeePourLeBonCentreAvecDevisBrouillon(): void
    {
        $this->assertSame(201, $this->post($this->validPayload()));
        $body = json_decode($this->client->getResponse()->getContent(), true);

        // La demande est rattachée au centre du host.
        $row = $this->db->fetchAssociative('SELECT centre_id, statut FROM demande_b2b WHERE id = :id', ['id' => $body['id']]);
        $this->assertSame($this->centreA, (int) $row['centre_id']);
        $this->assertSame('NOUVELLE', $row['statut']);

        // Un devis BROUILLON a été généré (fake IA) et rattaché — jamais « envoyé ».
        $devis = $this->db->fetchAssociative('SELECT statut, centre_id, total_cents FROM devis WHERE demande_id = :id', ['id' => $body['id']]);
        $this->assertNotFalse($devis, 'Un devis brouillon doit exister.');
        $this->assertSame('BROUILLON', $devis['statut']);
        $this->assertSame($this->centreA, (int) $devis['centre_id']);
        $this->assertGreaterThan(0, (int) $devis['total_cents']);
    }

    public function testHostInconnuRenvoie404(): void
    {
        $this->assertSame(404, $this->post($this->validPayload(), 'domaine-inexistant.invalid'));
    }

    public function testValidationEmailInvalide(): void
    {
        $payload = $this->validPayload();
        $payload['email'] = 'pas-un-email';
        $this->assertSame(422, $this->post($payload));
    }

    public function testValidationChampsRequisManquants(): void
    {
        // typeEvenement + message requis manquants.
        $this->assertSame(422, $this->post([
            'nomContact' => 'X',
            'email' => 'x@y.fr',
            'telephone' => '0600000000',
        ]));
    }
}

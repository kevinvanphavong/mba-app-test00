<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Prestation;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Chantier 3 — Réservation B2C invité (POST /api/public/reservations).
 *
 * Prouve : création OK pour le centre du host avec acompte 20 % ; impossible de
 * réserver la prestation d'un AUTRE centre (cross-tenant) ; validation des champs ;
 * host inconnu → 404 ; le reste de l'API reste protégé. Aucun paiement n'est traité.
 *
 * Données créées dans le test (transaction DAMA rollback en fin de test).
 */
class ReservationTest extends WebTestCase
{
    private const HOST_A = 'reservation-test-a.example';
    private const CRENEAU_FUTUR = '2030-06-15T18:00:00+00:00';

    private KernelBrowser $client;
    private Connection $db;
    private int $prestationA;
    private int $prestationB;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();

        $ids = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $this->assertCount(2, $ids, 'Il faut au moins 2 centres en base de test.');
        $repoCentre = $em->getRepository(Centre::class);
        $a = $repoCentre->find($ids[0]);
        $b = $repoCentre->find($ids[1]);
        $a->setActif(true)->setDomaine(self::HOST_A);

        // Prestation du centre A (du host) : 20,00 € l'unité.
        $presta = (new Prestation())->setCentre($a)->setNom('Bowling 1h')->setPrixCents(2000)->setActif(true);
        // Prestation du centre B : ne doit jamais être réservable depuis le host de A.
        $prestaB = (new Prestation())->setCentre($b)->setNom('Laser game B')->setPrixCents(3000)->setActif(true);
        $em->persist($presta);
        $em->persist($prestaB);
        $em->flush();

        $this->prestationA = $presta->getId();
        $this->prestationB = $prestaB->getId();
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function postReservation(array $payload, string $host = self::HOST_A): int
    {
        $this->client->request(
            'POST',
            '/api/public/reservations',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_HOST' => $host],
            content: json_encode($payload),
        );

        return $this->client->getResponse()->getStatusCode();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'prestationId' => $this->prestationA,
            'dateCreneau' => self::CRENEAU_FUTUR,
            'nbPersonnes' => 3,
            'nom' => 'Jean Visiteur',
            'email' => 'JEAN@example.com',
            'telephone' => '0601020304',
        ];
    }

    public function testReservationCreeePourLeBonCentreAvecAcompte20(): void
    {
        $status = $this->postReservation($this->validPayload());

        $this->assertSame(201, $status, 'Une réservation valide doit être créée (201).');
        $body = json_decode($this->client->getResponse()->getContent(), true);

        // 3 × 20,00 € = 60,00 € ; acompte 20 % = 12,00 €.
        $this->assertSame(6000, $body['montantTotalCents']);
        $this->assertSame(1200, $body['acompteCents']);
        $this->assertSame('EN_ATTENTE_ACOMPTE', $body['statut']);
        $this->assertSame('Bowling 1h', $body['prestation']);

        // La réservation est bien rattachée au centre du host (isolation).
        $row = $this->db->fetchAssociative('SELECT centre_id, prestation_id, email_invite FROM reservation WHERE id = :id', ['id' => $body['id']]);
        $centreAId = (int) $this->db->fetchOne('SELECT centre_id FROM prestation WHERE id = :p', ['p' => $this->prestationA]);
        $this->assertSame($centreAId, (int) $row['centre_id']);
        $this->assertSame($this->prestationA, (int) $row['prestation_id']);
        // Email normalisé en minuscules par le service.
        $this->assertSame('jean@example.com', $row['email_invite']);
    }

    public function testReserverPrestationDunAutreCentreRefuse(): void
    {
        $payload = $this->validPayload();
        $payload['prestationId'] = $this->prestationB; // prestation du centre B, host = A

        $status = $this->postReservation($payload);

        $this->assertSame(404, $status, 'Réserver une prestation d\'un autre centre doit être refusé (404).');
        $this->assertSame(
            0,
            (int) $this->db->fetchOne('SELECT count(*) FROM reservation WHERE prestation_id = :p', ['p' => $this->prestationB]),
            'Aucune réservation ne doit être créée pour une prestation cross-tenant.'
        );
    }

    public function testPrestationInexistante404(): void
    {
        $payload = $this->validPayload();
        $payload['prestationId'] = 99999999;
        $this->assertSame(404, $this->postReservation($payload), 'Prestation inexistante → 404.');
    }

    public function testValidationEmailInvalide(): void
    {
        $payload = $this->validPayload();
        $payload['email'] = 'pas-un-email';
        $this->assertSame(422, $this->postReservation($payload), 'Email invalide → 422.');
    }

    public function testValidationNbPersonnesNonPositif(): void
    {
        $payload = $this->validPayload();
        $payload['nbPersonnes'] = 0;
        $this->assertSame(422, $this->postReservation($payload), 'nbPersonnes = 0 → 422.');
    }

    public function testValidationCreneauPasse(): void
    {
        $payload = $this->validPayload();
        $payload['dateCreneau'] = '2000-01-01T10:00:00+00:00';
        $this->assertSame(422, $this->postReservation($payload), 'Créneau passé → 422.');
    }

    public function testHostInconnuRenvoie404(): void
    {
        $this->assertSame(
            404,
            $this->postReservation($this->validPayload(), 'domaine-inexistant.invalid'),
            'Host inconnu → 404, aucune réservation possible.'
        );
    }

    public function testResteDeLApiProtegeSansJwt(): void
    {
        $this->client->request('GET', '/api/zones', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertSame(401, $this->client->getResponse()->getStatusCode(), 'Le reste de l\'API doit rester protégé (401 sans JWT).');
    }
}

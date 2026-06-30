<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Tests\Fake\FakeCheckoutGateway;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Chantier Stripe — création de la session Checkout pour l'acompte.
 *
 * Prouve : session créée pour la BONNE résa du centre du host, montant = acompte
 * FIGÉ (jamais reçu du client) ; résa d'un autre centre → 404 ; déjà confirmée → 409.
 */
class ReservationCheckoutTest extends WebTestCase
{
    private const HOST_A = 'checkout-test-a.example';

    private KernelBrowser $client;
    private Connection $db;
    private int $resaA;
    private int $resaB;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();

        $ids = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $repo = $em->getRepository(Centre::class);
        $a = $repo->find($ids[0]);
        $b = $repo->find($ids[1]);
        $a->setActif(true)->setDomaine(self::HOST_A);

        $this->resaA = $this->makeReservation($em, $a, 2000, 1200);
        $this->resaB = $this->makeReservation($em, $b, 3000, 1800);
    }

    private function makeReservation(EntityManagerInterface $em, Centre $centre, int $prix, int $acompte): int
    {
        $presta = (new Prestation())->setCentre($centre)->setNom('Bowling')->setPrixCents($prix)->setActif(true);
        $em->persist($presta);
        $resa = (new Reservation())
            ->setCentre($centre)
            ->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-06-15 18:00'))
            ->setNbPersonnes(3)
            ->setNomInvite('Jean')
            ->setEmailInvite('jean@example.com')
            ->setTelephoneInvite('0601020304')
            ->setMontantTotalCents($prix * 3)
            ->setAcompteCents($acompte);
        $em->persist($resa);
        $em->flush();

        return $resa->getId();
    }

    public function testCheckoutRenvoieUrlEtMontantFige(): void
    {
        $this->client->request('POST', "/api/public/reservations/{$this->resaA}/checkout", server: ['HTTP_HOST' => self::HOST_A]);

        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertStringContainsString('checkout.stripe', $body['url']);

        // Le montant encaissé est l'acompte FIGÉ de la résa, jamais une valeur client.
        $gateway = static::getContainer()->get(FakeCheckoutGateway::class);
        $this->assertSame($this->resaA, $gateway->lastReservation?->getId());
        $this->assertSame(1200, $gateway->lastAmountCents);

        // L'id de session Stripe est mémorisé sur la résa.
        $sessionId = $this->db->fetchOne('SELECT stripe_session_id FROM reservation WHERE id = :id', ['id' => $this->resaA]);
        $this->assertNotEmpty($sessionId);
    }

    public function testCheckoutCrossTenantRefuse(): void
    {
        // Résa du centre B, demandée depuis le host de A → introuvable (404).
        $this->client->request('POST', "/api/public/reservations/{$this->resaB}/checkout", server: ['HTTP_HOST' => self::HOST_A]);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }

    public function testCheckoutDejaConfirmeeRenvoie409(): void
    {
        // Mutation via l'EM partagé (le kernel ne reboote pas entre requêtes) pour
        // que l'entité gérée reflète le statut confirmé vu par le contrôleur.
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->find(Reservation::class, $this->resaA)->setStatut(Reservation::STATUT_CONFIRMEE);
        $em->flush();

        $this->client->request('POST', "/api/public/reservations/{$this->resaA}/checkout", server: ['HTTP_HOST' => self::HOST_A]);
        $this->assertSame(409, $this->client->getResponse()->getStatusCode());
    }

    public function testCheckoutHostInconnu404(): void
    {
        $this->client->request('POST', "/api/public/reservations/{$this->resaA}/checkout", server: ['HTTP_HOST' => 'inconnu.invalid']);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}

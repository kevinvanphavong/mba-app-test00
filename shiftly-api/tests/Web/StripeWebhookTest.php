<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Message\ReservationConfirmeeMessage;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Messenger\Transport\InMemory\InMemoryTransport;

/**
 * Chantier Stripe — webhook de confirmation.
 *
 * Prouve : webhook SIGNÉ valide → résa CONFIRMEE + email dispatché en async ;
 * signature absente/invalide → 400 sans effet ; event rejoué → pas de double
 * confirmation (idempotence) ; montant ≠ acompte figé → pas de confirmation.
 */
class StripeWebhookTest extends WebTestCase
{
    private const SECRET = 'whsec_test_shiftly_phpunit'; // = .env.test

    private KernelBrowser $client;
    private Connection $db;
    private int $resaId;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();

        $centreId = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $centre = $em->getRepository(Centre::class)->find($centreId);

        $presta = (new Prestation())->setCentre($centre)->setNom('Bowling')->setPrixCents(2000)->setActif(true);
        $em->persist($presta);
        $resa = (new Reservation())
            ->setCentre($centre)->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-06-15 18:00'))
            ->setNbPersonnes(3)->setNomInvite('Jean')->setEmailInvite('jean@example.com')
            ->setTelephoneInvite('0601020304')->setMontantTotalCents(6000)->setAcompteCents(1200);
        $em->persist($resa);
        $em->flush();
        $this->resaId = $resa->getId();
    }

    private function eventPayload(int $reservationId, int $amount, string $eventId = 'evt_test_1'): string
    {
        return json_encode([
            'id' => $eventId,
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_test_1',
                'object' => 'checkout.session',
                'payment_status' => 'paid',
                'amount_total' => $amount,
                'metadata' => ['reservationId' => (string) $reservationId],
            ]],
        ], JSON_THROW_ON_ERROR);
    }

    private function sign(string $payload): string
    {
        $t = time();
        $signature = hash_hmac('sha256', "{$t}.{$payload}", self::SECRET);

        return "t={$t},v1={$signature}";
    }

    private function postWebhook(string $payload, ?string $signature): int
    {
        $server = ['CONTENT_TYPE' => 'application/json'];
        if (null !== $signature) {
            $server['HTTP_STRIPE_SIGNATURE'] = $signature;
        }
        $this->client->request('POST', '/api/public/stripe/webhook', server: $server, content: $payload);

        return $this->client->getResponse()->getStatusCode();
    }

    private function statut(): string
    {
        return (string) $this->db->fetchOne('SELECT statut FROM reservation WHERE id = :id', ['id' => $this->resaId]);
    }

    private function asyncTransport(): InMemoryTransport
    {
        return static::getContainer()->get('messenger.transport.async');
    }

    private function nbConfirmationMessages(): int
    {
        $n = 0;
        foreach ($this->asyncTransport()->getSent() as $envelope) {
            if ($envelope->getMessage() instanceof ReservationConfirmeeMessage) {
                ++$n;
            }
        }

        return $n;
    }

    public function testWebhookSigneConfirmeLaResaEtDispatcheLEmail(): void
    {
        $payload = $this->eventPayload($this->resaId, 1200);
        $status = $this->postWebhook($payload, $this->sign($payload));

        $this->assertSame(200, $status);
        $this->assertSame(Reservation::STATUT_CONFIRMEE, $this->statut());
        $this->assertNotEmpty($this->db->fetchOne('SELECT paid_at FROM reservation WHERE id = :id', ['id' => $this->resaId]));
        // Email parti en async (Messenger), pas en synchrone dans le webhook.
        $this->assertSame(1, $this->nbConfirmationMessages());
    }

    public function testWebhookSignatureInvalideRejete(): void
    {
        $payload = $this->eventPayload($this->resaId, 1200);
        $status = $this->postWebhook($payload, 't='.time().',v1=deadbeef');

        $this->assertSame(400, $status);
        $this->assertSame(Reservation::STATUT_EN_ATTENTE_ACOMPTE, $this->statut());
        $this->assertSame(0, $this->nbConfirmationMessages());
    }

    public function testWebhookSansSignatureRejete(): void
    {
        $payload = $this->eventPayload($this->resaId, 1200);
        $status = $this->postWebhook($payload, null);

        $this->assertSame(400, $status);
        $this->assertSame(Reservation::STATUT_EN_ATTENTE_ACOMPTE, $this->statut());
    }

    public function testWebhookRejoueEstIdempotent(): void
    {
        $payload = $this->eventPayload($this->resaId, 1200);

        // 1er webhook : confirme + dispatche exactement 1 email.
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));
        $this->assertSame(1, $this->nbConfirmationMessages());
        $paidAt1 = $this->db->fetchOne('SELECT paid_at FROM reservation WHERE id = :id', ['id' => $this->resaId]);

        // Rejeu du MÊME event : aucun nouvel email, statut et paid_at inchangés.
        // (le kernel reboote avant la 2e requête → transport neuf : 0 prouve le no-op)
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));
        $this->assertSame(0, $this->nbConfirmationMessages());
        $this->assertSame(Reservation::STATUT_CONFIRMEE, $this->statut());
        $paidAt2 = $this->db->fetchOne('SELECT paid_at FROM reservation WHERE id = :id', ['id' => $this->resaId]);
        $this->assertSame($paidAt1, $paidAt2, 'Un rejeu ne doit pas re-confirmer (paid_at inchangé).');
    }

    public function testWebhookMontantIncoherentNeConfirmePas(): void
    {
        // amount_total ≠ acompte figé (1200) → confirmation refusée, statut inchangé.
        $payload = $this->eventPayload($this->resaId, 1);
        $status = $this->postWebhook($payload, $this->sign($payload));

        $this->assertSame(200, $status);
        $this->assertSame(Reservation::STATUT_EN_ATTENTE_ACOMPTE, $this->statut());
        $this->assertSame(0, $this->nbConfirmationMessages());
    }
}

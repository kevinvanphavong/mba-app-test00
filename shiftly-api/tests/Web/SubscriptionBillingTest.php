<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Entity\User;
use App\Service\PlanAssignmentService;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Facturation récurrente Stripe : assignation → abonnement (faux gateway) ; webhook signé
 * invoice.paid → réactivation + facture ; invoice.payment_failed → suspension (accès coupé,
 * fail-closed) ; signature invalide → 400 sans effet ; rejeu idempotent.
 */
class SubscriptionBillingTest extends WebTestCase
{
    private const SECRET = 'whsec_test_shiftly_subscription'; // = .env.test
    private const MGR_PW = 'billing-mgr-pass-2026';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $hasher;
    private int $centreId;
    private string $customerId;

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

        $this->centreId = (int) $this->db->fetchOne('SELECT centre_id FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1');
        $centre = $this->em->getRepository(Centre::class)->find($this->centreId);

        // Assigne un plan → crée l'abonnement Stripe (faux gateway → cus_fake_<id>).
        $plan = (new Plan())->setNom('Pack Billing')->setCle('pack_billing_test')->setPrixMensuelCents(4900)->setActif(true);
        $this->em->persist($plan);
        $this->em->flush();
        static::getContainer()->get(PlanAssignmentService::class)->assigner($centre, $plan);

        $this->customerId = (string) $this->db->fetchOne('SELECT stripe_customer_id FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]);
    }

    private function sign(string $payload): string
    {
        $t = time();

        return 't='.$t.',v1='.hash_hmac('sha256', "{$t}.{$payload}", self::SECRET);
    }

    private function payload(string $type, string $invoiceId, int $amount): string
    {
        return (string) json_encode([
            'id' => 'evt_'.$invoiceId,
            'type' => $type,
            'data' => ['object' => [
                'id' => $invoiceId, 'customer' => $this->customerId,
                'amount_paid' => $amount, 'amount_due' => $amount, 'subscription' => 'sub_fake_'.$this->centreId,
            ]],
        ]);
    }

    private function postWebhook(string $payload, ?string $signature): int
    {
        $server = ['CONTENT_TYPE' => 'application/json'];
        if (null !== $signature) {
            $server['HTTP_STRIPE_SIGNATURE'] = $signature;
        }
        $this->client->request('POST', '/api/public/stripe/subscription-webhook', server: $server, content: $payload);

        return $this->client->getResponse()->getStatusCode();
    }

    private function actif(): bool
    {
        return (bool) $this->db->fetchOne('SELECT actif FROM centre WHERE id = :c', ['c' => $this->centreId]);
    }

    private function nbFactures(string $invoiceId): int
    {
        return (int) $this->db->fetchOne('SELECT COUNT(*) FROM invoice WHERE stripe_invoice_id = :i', ['i' => $invoiceId]);
    }

    public function testAssignationCreeUnAbonnement(): void
    {
        $row = $this->db->fetchAssociative('SELECT stripe_subscription_id, montant_cents, statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]);
        $this->assertSame('sub_fake_'.$this->centreId, $row['stripe_subscription_id']);
        $this->assertSame(4900, (int) $row['montant_cents']);
    }

    public function testInvoicePaidReactiveEtEnregistreFacture(): void
    {
        // Centre suspendu au préalable → invoice.paid doit le réactiver.
        $centre = $this->em->getRepository(Centre::class)->find($this->centreId);
        $centre->setActif(false);
        $this->em->flush();

        $payload = $this->payload('invoice.paid', 'in_paid_1', 4900);
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));

        $this->assertTrue($this->actif(), 'invoice.paid réactive le centre.');
        $this->assertSame(1, $this->nbFactures('in_paid_1'));
        $this->assertSame('paid', $this->db->fetchOne('SELECT statut FROM invoice WHERE stripe_invoice_id = :i', ['i' => 'in_paid_1']));
    }

    public function testPaymentFailedSuspendEtCoupeLAcces(): void
    {
        $mgrEmail = $this->db->fetchOne('SELECT email FROM "user" WHERE centre_id = :c AND role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1', ['c' => $this->centreId]);
        $mgr = $this->em->getRepository(User::class)->findOneBy(['email' => $mgrEmail]);
        $mgr->setPassword($this->hasher->hashPassword($mgr, self::MGR_PW));
        $this->em->flush();

        $payload = $this->payload('invoice.payment_failed', 'in_fail_1', 4900);
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));

        $this->assertFalse($this->actif(), 'invoice.payment_failed suspend le centre.');
        $this->assertSame('payment_failed', $this->db->fetchOne('SELECT statut FROM invoice WHERE stripe_invoice_id = :i', ['i' => 'in_fail_1']));

        // Accès coupé (fail-closed) : le gérant ne peut plus se connecter.
        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $mgrEmail, 'password' => self::MGR_PW]));
        $this->assertSame(401, $this->client->getResponse()->getStatusCode(), 'Centre suspendu pour impayé : login gérant refusé.');
    }

    public function testSignatureInvalideRejeteeSansEffet(): void
    {
        $payload = $this->payload('invoice.payment_failed', 'in_bad_1', 4900);
        $this->assertSame(400, $this->postWebhook($payload, 't='.time().',v1=deadbeef'));

        $this->assertTrue($this->actif(), 'Signature invalide : aucun changement d\'état.');
        $this->assertSame(0, $this->nbFactures('in_bad_1'), 'Signature invalide : aucune facture.');
    }

    public function testRejeuIdempotent(): void
    {
        $payload = $this->payload('invoice.paid', 'in_replay_1', 4900);
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));

        $this->assertSame(1, $this->nbFactures('in_replay_1'), 'Event rejoué : pas de facture en double.');
    }
}

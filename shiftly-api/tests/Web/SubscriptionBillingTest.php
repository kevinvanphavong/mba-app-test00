<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Entity\Subscription;
use App\Entity\User;
use App\Service\PlanAssignmentService;
use App\Tests\Fake\FakeSubscriptionGateway;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Facturation récurrente Stripe : assignation → lien Checkout + abonnement en attente
 * (faux gateway) ; Price réutilisé entre assignations ; détachement → résiliation
 * cancel_at_period_end ; webhook signé invoice.paid/failed → réactivation/suspension ;
 * signature invalide → 400 ; rejeu idempotent.
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
    private int $planId;
    private string $customerId;
    private ?string $checkoutUrl;

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

        // Assigne un plan → génère un lien Checkout + abonnement en attente (faux gateway).
        $plan = (new Plan())->setNom('Pack Billing')->setCle('pack_billing_test')->setPrixMensuelCents(4900)->setActif(true);
        $this->em->persist($plan);
        $this->em->flush();
        $this->planId = $plan->getId();
        $this->checkoutUrl = $this->assignment()->assigner($centre, $plan);

        $this->customerId = (string) $this->db->fetchOne('SELECT stripe_customer_id FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]);
    }

    private function assignment(): PlanAssignmentService
    {
        return static::getContainer()->get(PlanAssignmentService::class);
    }

    private function gateway(): FakeSubscriptionGateway
    {
        return static::getContainer()->get(FakeSubscriptionGateway::class);
    }

    private function sign(string $payload): string
    {
        $t = time();

        return 't='.$t.',v1='.hash_hmac('sha256', "{$t}.{$payload}", self::SECRET);
    }

    /** @param array<string, mixed> $object */
    private function eventPayload(string $type, string $id, array $object): string
    {
        return (string) json_encode(['id' => 'evt_'.$id, 'type' => $type, 'data' => ['object' => ['id' => $id] + $object]]);
    }

    private function payload(string $type, string $invoiceId, int $amount): string
    {
        return $this->eventPayload($type, $invoiceId, [
            'customer' => $this->customerId,
            'amount_paid' => $amount, 'amount_due' => $amount, 'subscription' => 'sub_live_'.$this->centreId,
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

    public function testAssignationMetEnAttenteEtRenvoieLien(): void
    {
        $this->assertSame('https://checkout.stripe.test/cs_fake_'.$this->centreId, $this->checkoutUrl, 'Assignation → URL de checkout.');

        $row = $this->db->fetchAssociative('SELECT stripe_subscription_id, montant_cents, statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]);
        $this->assertNull($row['stripe_subscription_id'], 'Pas encore d\'abonnement Stripe (attente du 1er paiement).');
        $this->assertSame('incomplete', $row['statut']);
        $this->assertSame(4900, (int) $row['montant_cents'], 'Montant = prix du plan (source serveur).');
    }

    public function testReassignerMemePlanNeRecreePasDePrice(): void
    {
        // setUp a déjà créé le Price une fois.
        $this->assertSame(1, $this->gateway()->pricesCreated);

        $centre = $this->em->getRepository(Centre::class)->find($this->centreId);
        $plan = $this->em->getRepository(Plan::class)->find($this->planId);
        $this->assignment()->assigner($centre, $plan);

        $this->assertSame(1, $this->gateway()->pricesCreated, 'Ré-assigner le même plan ne recrée aucun Price.');
    }

    public function testDetacherResilieStripe(): void
    {
        // Simule un abonnement déjà vivant (checkout complété).
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['centre' => $this->em->getRepository(Centre::class)->find($this->centreId)]);
        $sub->setStripeSubscriptionId('sub_live_1')->setStatut(Subscription::STATUT_ACTIVE);
        $this->em->flush();

        $centre = $this->em->getRepository(Centre::class)->find($this->centreId);
        $this->assertNull($this->assignment()->assigner($centre, null), 'Détachement → pas de lien.');

        $this->assertContains('sub_live_1', $this->gateway()->cancelled, 'cancel_at_period_end appelé.');
        $this->assertSame('canceled', $this->db->fetchOne('SELECT statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]));
    }

    public function testCheckoutCompletedLieLAbonnementEnTrialing(): void
    {
        $payload = $this->eventPayload('checkout.session.completed', 'cs_1', [
            'mode' => 'subscription', 'customer' => $this->customerId, 'subscription' => 'sub_live_'.$this->centreId,
        ]);
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));

        $row = $this->db->fetchAssociative('SELECT stripe_subscription_id, statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]);
        $this->assertSame('sub_live_'.$this->centreId, $row['stripe_subscription_id'], 'Abonnement réel lié.');
        $this->assertSame('trialing', $row['statut'], 'Passe de l\'attente à l\'essai.');
    }

    public function testFactureEssaiZeroNEcrasePasTrialing(): void
    {
        // Abonnement lié en essai (checkout complété).
        $p1 = $this->eventPayload('checkout.session.completed', 'cs_trial', [
            'mode' => 'subscription', 'customer' => $this->customerId, 'subscription' => 'sub_live_'.$this->centreId,
        ]);
        $this->assertSame(200, $this->postWebhook($p1, $this->sign($p1)));
        $this->assertSame('trialing', $this->db->fetchOne('SELECT statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]));

        // Facture d'essai à 0 € (Stripe émet invoice.paid pour l'invoice de trial) → reste trialing.
        $p2 = $this->payload('invoice.paid', 'in_trial_zero', 0);
        $this->assertSame(200, $this->postWebhook($p2, $this->sign($p2)));
        $this->assertSame('trialing', $this->db->fetchOne('SELECT statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]), 'Une facture d\'essai à 0 € ne confirme pas l\'abonnement.');
    }

    public function testSubscriptionDeletedAnnuleEtSuspend(): void
    {
        $payload = $this->eventPayload('customer.subscription.deleted', 'sub_del_1', [
            'customer' => $this->customerId, 'status' => 'canceled',
        ]);
        $this->assertSame(200, $this->postWebhook($payload, $this->sign($payload)));

        $this->assertSame('canceled', $this->db->fetchOne('SELECT statut FROM subscription WHERE centre_id = :c', ['c' => $this->centreId]));
        $this->assertFalse($this->actif(), 'Fin d\'abonnement → centre suspendu (fail-closed).');
    }

    public function testInvoicePaidReactiveEtEnregistreFacture(): void
    {
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

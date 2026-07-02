<?php

namespace App\Service;

use App\Entity\Invoice;
use App\Entity\Subscription;
use App\Repository\InvoiceRepository;
use App\Repository\SubscriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Traite un event Stripe Billing DÉJÀ vérifié (signature contrôlée en amont par le
 * contrôleur). Logique métier hors contrôleur.
 *
 * **Idempotent** : la facture est enregistrée sous la clé unique `stripeInvoiceId`
 * (un event rejoué ne crée aucun doublon) et la (dé)suspension passe par le seam
 * {@see ClientManagementService} (bascule no-op si l'état est déjà celui voulu).
 *  - `invoice.paid` → facture PAYÉE + centre réactivé.
 *  - `invoice.payment_failed` → facture ÉCHOUÉE + centre SUSPENDU (accès coupé, fail-closed).
 */
final class SubscriptionWebhookProcessor
{
    public function __construct(
        private readonly SubscriptionRepository $subscriptions,
        private readonly InvoiceRepository $invoices,
        private readonly ClientManagementService $clientManagement,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function handle(string $type, object $invoiceObject): void
    {
        $stripeInvoiceId = (string) ($invoiceObject->id ?? '');
        $customerId = (string) ($invoiceObject->customer ?? '');
        if ('' === $stripeInvoiceId || '' === $customerId) {
            return;
        }

        $subscription = $this->subscriptions->findOneBy(['stripeCustomerId' => $customerId]);
        if (null === $subscription || null === $subscription->getCentre()) {
            $this->logger->warning('Webhook abonnement : abonnement introuvable', ['customer' => $customerId]);

            return;
        }
        $centre = $subscription->getCentre();

        if ('invoice.paid' === $type) {
            $this->enregistrerFacture($subscription, $stripeInvoiceId, (int) ($invoiceObject->amount_paid ?? 0), Invoice::STATUT_PAID);
            $subscription->setStatut(Subscription::STATUT_ACTIVE);
            $this->clientManagement->reactiver($centre);
        } elseif ('invoice.payment_failed' === $type) {
            $this->enregistrerFacture($subscription, $stripeInvoiceId, (int) ($invoiceObject->amount_due ?? 0), Invoice::STATUT_FAILED);
            $subscription->setStatut(Subscription::STATUT_PAST_DUE);
            // Impayé → suspension via le SEAM existant (coupe site public + cockpit).
            $this->clientManagement->suspendre($centre);
        }

        $this->em->flush();
    }

    private function enregistrerFacture(Subscription $subscription, string $stripeInvoiceId, int $montantCents, string $statut): void
    {
        // Idempotence : une facture déjà enregistrée (event rejoué) n'est jamais dupliquée.
        if (null !== $this->invoices->findOneBy(['stripeInvoiceId' => $stripeInvoiceId])) {
            return;
        }

        $facture = (new Invoice())
            ->setCentre($subscription->getCentre())
            ->setStripeInvoiceId($stripeInvoiceId)
            ->setMontantCents($montantCents)
            ->setStatut($statut);
        $this->em->persist($facture);
    }
}

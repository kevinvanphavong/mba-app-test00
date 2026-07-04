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
 * contrôleur). Logique métier hors contrôleur. Reflète l'état Stripe dans la Subscription
 * locale et (dé)suspend le centre via le seam {@see ClientManagementService}.
 *
 * **Idempotent** : facture enregistrée sous clé unique `stripeInvoiceId` ; un statut plus
 * récent n'est jamais écrasé par un event rejoué (un abonnement `canceled` reste terminal).
 *  - `checkout.session.completed` (mode subscription) → lie l'abonnement + statut `trialing`.
 *  - `customer.subscription.updated` → reflète le statut Stripe (trialing/active/past_due/canceled).
 *  - `customer.subscription.deleted` → `canceled` + centre SUSPENDU (fail-closed).
 *  - `invoice.paid` → facture PAYÉE + centre réactivé · `invoice.payment_failed` → ÉCHOUÉE + SUSPENDU.
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

    public function handle(string $type, object $object): void
    {
        match ($type) {
            'invoice.paid', 'invoice.payment_failed' => $this->handleInvoice($type, $object),
            'checkout.session.completed' => $this->handleCheckoutCompleted($object),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($object),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($object),
            default => null,
        };
    }

    private function handleInvoice(string $type, object $invoice): void
    {
        $stripeInvoiceId = (string) ($invoice->id ?? '');
        $subscription = $this->find(null, (string) ($invoice->customer ?? ''));
        if ('' === $stripeInvoiceId || null === $subscription || null === $subscription->getCentre()) {
            return;
        }
        $centre = $subscription->getCentre();

        if ('invoice.paid' === $type) {
            $montantPaye = (int) ($invoice->amount_paid ?? 0);
            $this->enregistrerFacture($subscription, $stripeInvoiceId, $montantPaye, Invoice::STATUT_PAID);
            // Un paiement RÉEL (montant > 0) confirme l'abonnement. La facture d'essai à 0 €
            // (période trialing) ne doit PAS écraser le statut `trialing` en `active`.
            if ($montantPaye > 0) {
                $subscription->setStatut(Subscription::STATUT_ACTIVE);
            }
            $this->clientManagement->reactiver($centre);
        } else {
            $this->enregistrerFacture($subscription, $stripeInvoiceId, (int) ($invoice->amount_due ?? 0), Invoice::STATUT_FAILED);
            $subscription->setStatut(Subscription::STATUT_PAST_DUE);
            $this->clientManagement->suspendre($centre); // impayé → accès coupé (fail-closed)
        }

        $this->em->flush();
    }

    private function handleCheckoutCompleted(object $session): void
    {
        if ('subscription' !== (string) ($session->mode ?? '')) {
            return;
        }
        $subscription = $this->find(null, (string) ($session->customer ?? ''));
        $subscriptionId = (string) ($session->subscription ?? '');
        if (null === $subscription || '' === $subscriptionId) {
            $this->logger->warning('Webhook checkout.session.completed : abonnement introuvable', ['customer' => $session->customer ?? null]);

            return;
        }

        // Lie l'abonnement réel. Ne repasse à `trialing` que depuis l'attente (idempotence :
        // un rejeu tardif ne rétrograde pas un abonnement déjà actif).
        $subscription->setStripeSubscriptionId($subscriptionId);
        if (Subscription::STATUT_INCOMPLETE === $subscription->getStatut()) {
            $subscription->setStatut(Subscription::STATUT_TRIALING);
        }
        $this->em->flush();
    }

    private function handleSubscriptionUpdated(object $sub): void
    {
        $subscription = $this->find((string) ($sub->id ?? ''), (string) ($sub->customer ?? ''));
        if (null === $subscription || Subscription::STATUT_CANCELED === $subscription->getStatut()) {
            return; // introuvable, ou état terminal jamais réanimé
        }

        $statut = $this->mapStatut((string) ($sub->status ?? ''));
        if (null !== $statut) {
            $subscription->setStatut($statut);
            $this->em->flush();
        }
    }

    private function handleSubscriptionDeleted(object $sub): void
    {
        $subscription = $this->find((string) ($sub->id ?? ''), (string) ($sub->customer ?? ''));
        if (null === $subscription || null === $subscription->getCentre()) {
            return;
        }

        $subscription->setStatut(Subscription::STATUT_CANCELED);
        $this->clientManagement->suspendre($subscription->getCentre()); // fin d'abonnement → accès coupé
        $this->em->flush();
    }

    /** Résout la Subscription locale par son id Stripe, sinon par le Customer. */
    private function find(?string $subscriptionId, string $customerId): ?Subscription
    {
        if (null !== $subscriptionId && '' !== $subscriptionId) {
            $found = $this->subscriptions->findOneBy(['stripeSubscriptionId' => $subscriptionId]);
            if (null !== $found) {
                return $found;
            }
        }

        return '' !== $customerId ? $this->subscriptions->findOneBy(['stripeCustomerId' => $customerId]) : null;
    }

    private function mapStatut(string $stripeStatus): ?string
    {
        return match ($stripeStatus) {
            'trialing' => Subscription::STATUT_TRIALING,
            'active' => Subscription::STATUT_ACTIVE,
            'past_due' => Subscription::STATUT_PAST_DUE,
            'canceled' => Subscription::STATUT_CANCELED,
            default => null, // incomplete/unpaid/inconnu : on ne touche pas au statut local
        };
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

<?php

namespace App\Controller\Web;

use App\Service\SubscriptionWebhookProcessor;
use Psr\Log\LoggerInterface;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Webhook Stripe Billing (abonnements AGENCE) — DISTINCT du webhook d'acompte.
 *
 * Zone publique `^/api/public` (sans auth, exemptée CSRF) MAIS protégée par la
 * **vérification de signature Stripe** (secret dédié) : le corps brut + `Stripe-Signature`
 * sont validés AVANT tout effet. Signature absente/invalide → 400, aucun changement d'état.
 *
 * Le traitement (idempotent : facture enregistrée, centre (dé)suspendu via le seam) est
 * délégué à {@see SubscriptionWebhookProcessor}. 200 systématique sur event signé.
 */
class StripeSubscriptionWebhookController extends AbstractController
{
    public function __construct(
        private readonly SubscriptionWebhookProcessor $processor,
        private readonly LoggerInterface $logger,
        private readonly string $stripeWebhookSecret,
    ) {
    }

    #[Route('/api/public/stripe/subscription-webhook', name: 'public_stripe_subscription_webhook', methods: ['POST'])]
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->headers->get('Stripe-Signature', '');

        // 1) Vérification de signature OBLIGATOIRE — avant tout effet de bord.
        try {
            $event = Webhook::constructEvent($payload, $signature, $this->stripeWebhookSecret);
        } catch (SignatureVerificationException|\UnexpectedValueException $e) {
            $this->logger->warning('Stripe subscription webhook rejeté (signature)', ['error' => $e->getMessage()]);

            return $this->json(['message' => 'Signature invalide.'], 400);
        }

        // 2) Effet de bord uniquement pour les events suivis, après signature OK.
        $suivis = [
            'checkout.session.completed',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.paid',
            'invoice.payment_failed',
        ];
        if (\in_array($event->type, $suivis, true)) {
            $this->processor->handle($event->type, $event->data->object);
        }

        // 200 systématique pour les events signés (même ignorés) : Stripe ne rejoue pas.
        return $this->json(['received' => true]);
    }
}

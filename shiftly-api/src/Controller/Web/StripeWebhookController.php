<?php

namespace App\Controller\Web;

use App\Service\ReservationConfirmer;
use Psr\Log\LoggerInterface;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Webhook Stripe — confirme une réservation après encaissement de l'acompte.
 *
 * Zone publique `^/api/public` (sans auth, exemptée CSRF) MAIS protégée par la
 * **vérification de signature Stripe** : le corps brut + l'en-tête `Stripe-Signature`
 * sont validés contre le secret du webhook AVANT tout effet. Une requête non signée
 * ou à signature invalide est rejetée (400) sans aucun changement d'état.
 *
 * La confirmation elle-même (idempotente, isolée à la résa référencée dans les
 * métadonnées signées) est déléguée à {@see ReservationConfirmer}.
 */
class StripeWebhookController extends AbstractController
{
    public function __construct(
        private readonly ReservationConfirmer $confirmer,
        private readonly LoggerInterface $logger,
        private readonly string $stripeWebhookSecret,
    ) {
    }

    #[Route('/api/public/stripe/webhook', name: 'public_stripe_webhook', methods: ['POST'])]
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->headers->get('Stripe-Signature', '');

        // 1) Vérification de signature OBLIGATOIRE — avant tout effet de bord.
        try {
            $event = Webhook::constructEvent($payload, $signature, $this->stripeWebhookSecret);
        } catch (SignatureVerificationException|\UnexpectedValueException $e) {
            $this->logger->warning('Stripe webhook rejeté (signature)', ['error' => $e->getMessage()]);

            return $this->json(['message' => 'Signature invalide.'], 400);
        }

        // 2) Seul l'encaissement effectif de l'acompte confirme la réservation.
        if ('checkout.session.completed' === $event->type) {
            $session = $event->data->object;

            $reservationId = (int) ($session->metadata->reservationId ?? 0);
            $amountPaid = (int) ($session->amount_total ?? 0);
            $paid = 'paid' === ($session->payment_status ?? null);

            if ($reservationId > 0 && $paid) {
                // Idempotent : un event rejoué ne reconfirme rien (cf. ReservationConfirmer).
                $this->confirmer->confirmPaid($reservationId, $amountPaid);
            }
        }

        // 200 systématique pour les events signés (même ignorés) : Stripe ne rejoue pas.
        return $this->json(['received' => true]);
    }
}

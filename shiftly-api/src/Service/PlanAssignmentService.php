<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Entity\Subscription;
use App\Repository\SubscriptionRepository;
use App\Service\Stripe\SubscriptionGatewayInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Assigne un {@see Plan} à un {@see Centre} : DÉRIVE son `abonnementMensuelCents` du prix
 * du plan (source unique du tarif → alimente le MRR) ET génère un lien Stripe Checkout
 * (mode subscription) à transmettre au client (vente pilotée super-admin).
 *
 * La Subscription locale est mise en attente (`INCOMPLETE`, sans `stripeSubscriptionId`) ;
 * l'abonnement réel est lié à la complétion du Checkout (webhook). Détacher un plan
 * (null) résilie l'abonnement Stripe en fin de période (`cancel_at_period_end`).
 *
 * Logique métier centralisée ici (jamais dans le contrôleur/processor).
 */
final class PlanAssignmentService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SubscriptionGatewayInterface $gateway,
        private readonly SubscriptionRepository $subscriptions,
        private readonly string $publicSiteBaseUrl,
    ) {
    }

    /**
     * @return string|null l'URL de paiement Checkout (assignation), ou null (détachement)
     */
    public function assigner(Centre $centre, ?Plan $plan): ?string
    {
        $centre->setPlan($plan);
        $centre->setAbonnementMensuelCents($plan?->getPrixMensuelCents() ?? 0);

        $subscription = $this->subscriptions->findOneBy(['centre' => $centre]);

        // Détachement : résiliation Stripe en fin de période + statut local annulé.
        if (null === $plan) {
            if (null !== $subscription) {
                if (null !== $subscription->getStripeSubscriptionId()) {
                    $this->gateway->cancelAtPeriodEnd($subscription->getStripeSubscriptionId());
                }
                $subscription->setStatut(Subscription::STATUT_CANCELED);
            }
            $this->em->flush();

            return null;
        }

        // Assignation : Product/Price réutilisés (recréés si le prix a changé) + lien Checkout.
        $this->gateway->ensurePrice($plan);

        [$successUrl, $cancelUrl] = $this->urlsRetour($centre);
        $checkout = $this->gateway->createSubscriptionCheckout(
            $centre,
            $plan,
            $subscription?->getStripeCustomerId(),
            $successUrl,
            $cancelUrl,
        );

        $subscription ??= (new Subscription())->setCentre($centre);
        // Ne pas écraser un abonnement DÉJÀ vivant (trialing/active) : on ré-émet un lien sans
        // remettre l'état en attente. Sinon (nouveau, incomplet, annulé) → attente du 1er paiement.
        $dejaVivant = null !== $subscription->getStripeSubscriptionId()
            && \in_array($subscription->getStatut(), [Subscription::STATUT_TRIALING, Subscription::STATUT_ACTIVE], true);

        $subscription
            ->setPlan($plan)
            ->setStripeCustomerId($checkout->customerId)
            ->setMontantCents($plan->getPrixMensuelCents());
        if (!$dejaVivant) {
            $subscription->setStripeSubscriptionId(null)->setStatut(Subscription::STATUT_INCOMPLETE);
        }

        $this->em->persist($subscription);
        $this->em->flush();

        return $checkout->checkoutUrl;
    }

    /**
     * Pages de retour Checkout : domaine du centre s'il existe, sinon base plateforme
     * (jamais de crash si le centre n'a pas encore de domaine).
     *
     * @return array{0: string, 1: string} [success_url, cancel_url]
     */
    private function urlsRetour(Centre $centre): array
    {
        $domaine = $centre->getDomaine();
        $base = null !== $domaine && '' !== $domaine ? 'https://'.$domaine : rtrim($this->publicSiteBaseUrl, '/');

        return [$base.'/?abonnement=ok', $base.'/?abonnement=annule'];
    }
}

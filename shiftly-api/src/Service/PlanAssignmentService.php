<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Plan;
use App\Entity\Subscription;
use App\Repository\SubscriptionRepository;
use App\Service\Stripe\SubscriptionGatewayInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Assigne un {@see Plan} à un {@see Centre} : DÉRIVE son `abonnementMensuelCents` du
 * prix du plan (source unique de vérité du tarif → alimente le MRR) ET crée/met à jour
 * son abonnement Stripe (compte AGENCE) via le {@see SubscriptionGatewayInterface}.
 *
 * Logique métier centralisée ici (jamais dans le contrôleur/processor). Détacher un
 * plan (null) remet l'abonnement à 0 et marque l'abonnement Stripe local comme annulé.
 */
final class PlanAssignmentService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SubscriptionGatewayInterface $gateway,
        private readonly SubscriptionRepository $subscriptions,
    ) {
    }

    public function assigner(Centre $centre, ?Plan $plan): void
    {
        $centre->setPlan($plan);
        $centre->setAbonnementMensuelCents($plan?->getPrixMensuelCents() ?? 0);

        $subscription = $this->subscriptions->findOneBy(['centre' => $centre]);

        if (null !== $plan) {
            // Crée/réutilise le Customer + Subscription Stripe (montant = prix du plan).
            $result = $this->gateway->ensureSubscription($centre, $plan, $subscription?->getStripeCustomerId());

            $subscription ??= (new Subscription())->setCentre($centre);
            $subscription
                ->setPlan($plan)
                ->setStripeCustomerId($result->customerId)
                ->setStripeSubscriptionId($result->subscriptionId)
                ->setStatut($result->statut)
                ->setMontantCents($result->montantCents);
            $this->em->persist($subscription);
        } elseif (null !== $subscription) {
            // Plan détaché : on marque l'abonnement local comme annulé (résiliation Stripe = P2c).
            $subscription->setStatut(Subscription::STATUT_CANCELED);
        }

        $this->em->flush();
    }
}

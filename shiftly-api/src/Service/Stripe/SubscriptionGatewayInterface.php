<?php

namespace App\Service\Stripe;

use App\Entity\Centre;
use App\Entity\Plan;

/**
 * Seam de facturation récurrente (compte Stripe de l'AGENCE) : isole le SDK Stripe du
 * reste de l'app (testabilité + remplaçabilité). Vente pilotée super-admin : on génère
 * un lien Checkout hébergé (mode subscription) à envoyer au client ; aucune donnée carte
 * ne transite par Shiftly. Le montant facturé est TOUJOURS `plan->getPrixMensuelCents()`.
 */
interface SubscriptionGatewayInterface
{
    /**
     * Assure le Product + Price Stripe du plan : réutilise `stripeProductId`/`stripePriceId`
     * stockés sur le {@see Plan}, ne recrée le Price que si le prix du plan a changé. Met à
     * jour le plan en place. Retourne true si un nouveau Price a été créé.
     */
    public function ensurePrice(Plan $plan): bool;

    /**
     * Crée une Checkout Session `mode: subscription` (Customer réutilisé, Price du plan,
     * essai `trial_period_days`, metadata centreId). Retourne l'URL de paiement + le Customer.
     * `$successUrl`/`$cancelUrl` = pages de retour (domaine du centre).
     */
    public function createSubscriptionCheckout(Centre $centre, Plan $plan, ?string $customerId, string $successUrl, string $cancelUrl): SubscriptionCheckout;

    /** Résilie l'abonnement en fin de période courante (pas de coupure immédiate). */
    public function cancelAtPeriodEnd(string $stripeSubscriptionId): void;
}

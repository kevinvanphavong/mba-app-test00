<?php

namespace App\Service;

use App\Entity\Reservation;
use App\Service\Stripe\CheckoutGatewayInterface;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Démarre le paiement de l'acompte d'une réservation : crée la session Checkout
 * (via le gateway), mémorise son id sur la résa, et renvoie l'URL hébergée Stripe.
 *
 * Le montant n'est jamais reçu du client : il vient de la résa (acompte figé).
 * Les URLs de retour pointent vers les pages succès/annulé du site public.
 */
final class ReservationPaymentService
{
    public function __construct(
        private readonly CheckoutGatewayInterface $checkoutGateway,
        private readonly EntityManagerInterface $em,
        private readonly string $publicSiteBaseUrl,
    ) {
    }

    public function createCheckoutUrl(Reservation $reservation): string
    {
        $base = rtrim($this->publicSiteBaseUrl, '/');
        $id = $reservation->getId();

        $session = $this->checkoutGateway->createSession(
            $reservation,
            $base.'/site/reserver/succes?reservation='.$id,
            $base.'/site/reserver/annule?reservation='.$id,
        );

        $reservation->setStripeSessionId($session->id);
        $this->em->flush();

        return $session->url;
    }
}

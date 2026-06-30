<?php

namespace App\Service;

use App\Entity\Reservation;
use App\Message\ReservationConfirmeeMessage;
use App\Repository\ReservationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Confirme une réservation après encaissement de l'acompte (appelé par le webhook
 * Stripe, une fois la signature vérifiée). Logique métier hors contrôleur.
 *
 * **Idempotent** : une résa déjà CONFIRMEE n'est jamais reconfirmée ni recomptée,
 * et aucun second email n'est dispatché — un même event Stripe rejoué est sans effet.
 * **Montant figé** : l'acompte payé doit correspondre à l'acompte figé de la résa,
 * sinon on refuse la confirmation (paiement incohérent).
 */
final class ReservationConfirmer
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return bool true si la résa vient d'être confirmée ; false si no-op (déjà
     *              confirmée, introuvable, ou montant incohérent)
     */
    public function confirmPaid(int $reservationId, int $amountPaidCents): bool
    {
        $reservation = $this->reservations->find($reservationId);
        if (null === $reservation) {
            $this->logger->warning('Stripe webhook: réservation introuvable', ['reservationId' => $reservationId]);

            return false;
        }

        // Idempotence : déjà confirmée → aucun effet (event rejoué, double webhook…).
        if ($reservation->isConfirmee()) {
            return false;
        }

        // Défense : le montant encaissé doit être l'acompte figé de la résa.
        if ($amountPaidCents !== $reservation->getAcompteCents()) {
            $this->logger->error('Stripe webhook: montant payé ≠ acompte figé', [
                'reservationId' => $reservationId,
                'paid' => $amountPaidCents,
                'attendu' => $reservation->getAcompteCents(),
            ]);

            return false;
        }

        $reservation
            ->setStatut(Reservation::STATUT_CONFIRMEE)
            ->setPaidAt(new \DateTimeImmutable());
        $this->em->flush();

        // Effet de bord async (email) APRÈS le changement de statut, via Messenger.
        $this->bus->dispatch(new ReservationConfirmeeMessage((int) $reservation->getId()));

        return true;
    }
}

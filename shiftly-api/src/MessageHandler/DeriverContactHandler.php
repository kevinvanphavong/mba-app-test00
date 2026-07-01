<?php

namespace App\MessageHandler;

use App\Message\DeriverContactMessage;
use App\Repository\DemandeB2BRepository;
use App\Repository\ReservationRepository;
use App\Service\ContactDeriver;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Dérive/actualise un contact CRM depuis une réservation ou une demande B2B (async).
 * La dédup et l'isolation par centre sont assurées par ContactDeriver.
 */
#[AsMessageHandler]
final class DeriverContactHandler
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly DemandeB2BRepository $demandes,
        private readonly ContactDeriver $deriver,
    ) {
    }

    public function __invoke(DeriverContactMessage $message): void
    {
        if (DeriverContactMessage::SOURCE_RESERVATION === $message->source) {
            $reservation = $this->reservations->find($message->id);
            if (null !== $reservation) {
                $this->deriver->upsertFromReservation($reservation);
            }

            return;
        }

        $demande = $this->demandes->find($message->id);
        if (null !== $demande) {
            $this->deriver->upsertFromDemande($demande);
        }
    }
}

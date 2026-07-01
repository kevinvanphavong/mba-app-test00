<?php

namespace App\Service;

use App\Entity\DemandeB2B;
use App\Entity\Reservation;
use App\Message\DemandeAvisMessage;
use App\Message\DeriverContactMessage;
use App\Message\RelanceNoShowMessage;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\DelayStamp;

/**
 * Planifie les effets de bord CRM via Messenger (JAMAIS en onFlush ni synchrone) :
 * dérivation de contact immédiate, relance no-show et demande d'avis DIFFÉRÉES
 * (DelayStamp jusqu'après le créneau). Le déclenchement ne dépend pas de l'IA.
 */
final class CrmScheduler
{
    /** Marge après le créneau avant d'examiner no-show / demander un avis. */
    private const MARGE_APRES_CRENEAU_S = 2 * 3600;

    public function __construct(private readonly MessageBusInterface $bus)
    {
    }

    public function planifierDepuisReservation(Reservation $reservation): void
    {
        $id = (int) $reservation->getId();
        $delai = $this->delaiApresCreneauMs($reservation->getDateCreneau());

        $this->bus->dispatch(new DeriverContactMessage(DeriverContactMessage::SOURCE_RESERVATION, $id));
        $this->bus->dispatch(new RelanceNoShowMessage($id), [new DelayStamp($delai)]);
        $this->bus->dispatch(new DemandeAvisMessage($id), [new DelayStamp($delai)]);
    }

    public function planifierDepuisDemande(DemandeB2B $demande): void
    {
        $this->bus->dispatch(new DeriverContactMessage(DeriverContactMessage::SOURCE_DEMANDE, (int) $demande->getId()));
    }

    private function delaiApresCreneauMs(?\DateTimeImmutable $creneau): int
    {
        if (null === $creneau) {
            return 0;
        }

        $cibleMs = ($creneau->getTimestamp() + self::MARGE_APRES_CRENEAU_S) * 1000;
        $maintenantMs = (int) (microtime(true) * 1000);

        return max(0, $cibleMs - $maintenantMs);
    }
}

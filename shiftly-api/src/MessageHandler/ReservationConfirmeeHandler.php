<?php

namespace App\MessageHandler;

use App\Message\ReservationConfirmeeMessage;
use App\Repository\ReservationRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Mime\Email;

/**
 * Envoie l'email de confirmation de réservation à l'invité (asynchrone).
 * Un échec d'envoi ne doit pas relancer indéfiniment le webhook : on log.
 */
#[AsMessageHandler]
final class ReservationConfirmeeHandler
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly string $fromEmail,
    ) {
    }

    public function __invoke(ReservationConfirmeeMessage $message): void
    {
        $reservation = $this->reservations->find($message->reservationId);
        if (null === $reservation || !$reservation->isConfirmee()) {
            return; // résa supprimée ou non confirmée : rien à envoyer
        }

        $acompte = number_format($reservation->getAcompteCents() / 100, 2, ',', ' ');
        $creneau = $reservation->getDateCreneau()?->format('d/m/Y à H\hi') ?? '';

        $html = sprintf(
            '<p>Bonjour %s,</p><p>Votre réservation « %s » est <strong>confirmée</strong>.</p>'
            .'<p>Créneau : %s · %d personne(s)</p><p>Acompte réglé : %s €. Le solde se règle sur place.</p>',
            htmlspecialchars($reservation->getNomInvite() ?? ''),
            htmlspecialchars($reservation->getPrestation()?->getNom() ?? ''),
            htmlspecialchars($creneau),
            $reservation->getNbPersonnes(),
            $acompte,
        );

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->fromEmail)
                    ->to((string) $reservation->getEmailInvite())
                    ->subject('Votre réservation est confirmée')
                    ->html($html)
            );
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Reservation confirmation email failed', [
                'reservationId' => $reservation->getId(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}

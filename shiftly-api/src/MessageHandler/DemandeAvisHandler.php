<?php

namespace App\MessageHandler;

use App\Message\DemandeAvisMessage;
use App\Repository\ReservationRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Mime\Email;

/**
 * À échéance post-visite : si la réservation a été honorée (confirmée), envoie au
 * client un email avec le lien de dépôt d'avis. N'envoie rien pour un no-show.
 * L'envoi passe par Messenger (le mailer route SendEmailMessage en async).
 */
#[AsMessageHandler]
final class DemandeAvisHandler
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly string $fromEmail,
        private readonly string $publicSiteBaseUrl,
    ) {
    }

    public function __invoke(DemandeAvisMessage $message): void
    {
        $reservation = $this->reservations->find($message->reservationId);
        if (null === $reservation || !$reservation->isConfirmee()) {
            return; // seules les visites honorées reçoivent une demande d'avis
        }

        $lien = rtrim($this->publicSiteBaseUrl, '/').'/site/avis?reservation='.$reservation->getId();

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->fromEmail)
                    ->to((string) $reservation->getEmailInvite())
                    ->subject('Votre avis nous intéresse')
                    ->text(sprintf("Merci de votre visite !\nPartagez votre avis : %s", $lien))
            );
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Envoi demande d\'avis échoué', [
                'reservation' => $reservation->getId(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}

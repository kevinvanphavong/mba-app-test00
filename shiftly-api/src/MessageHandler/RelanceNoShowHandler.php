<?php

namespace App\MessageHandler;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Core\Ia\IaGeneratorInterface;
use App\Entity\Contact;
use App\Entity\Relance;
use App\Entity\Reservation;
use App\Message\RelanceNoShowMessage;
use App\Repository\ReservationRepository;
use App\Service\ContactDeriver;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * À échéance d'un no-show : si la réservation n'est pas confirmée (créneau non
 * honoré), crée une relance BROUILLON pour le contact. La création NE dépend PAS de
 * l'IA ; l'IA rédige `texte` en best-effort (vide → statut A_REDIGER si quota/IA KO).
 * L'envoi reste une action humaine (l'IA n'envoie jamais seule).
 */
#[AsMessageHandler]
final class RelanceNoShowHandler
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly ContactDeriver $deriver,
        private readonly IaGeneratorInterface $ia,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(RelanceNoShowMessage $message): void
    {
        $reservation = $this->reservations->find($message->reservationId);
        // Réservation absente ou honorée (confirmée) → pas de relance.
        if (null === $reservation || $reservation->isConfirmee()) {
            return;
        }

        $contact = $this->deriver->upsertFromReservation($reservation);
        if (null === $contact) {
            return; // fail-closed (pas de centre / email)
        }
        $contact->addSegment(Contact::SEGMENT_NO_SHOW);

        $relance = (new Relance())
            ->setCentre($reservation->getCentre())
            ->setContact($contact)
            ->setMotif(Relance::MOTIF_NO_SHOW);

        // Rédaction IA best-effort : ne bloque JAMAIS la création de la relance.
        try {
            $relance
                ->setTexte($this->redigerTexte($reservation))
                ->setStatut(Relance::STATUT_A_ENVOYER);
        } catch (IaQuotaDepasseException|IaIndisponibleException $e) {
            $relance->setStatut(Relance::STATUT_A_REDIGER); // texte vide, à rédiger à la main
            $this->logger->info('Relance no-show sans texte IA (quota/indispo)', [
                'reservation' => $reservation->getId(),
                'raison' => $e->getMessage(),
            ]);
        }

        $this->em->persist($relance);
        $this->em->flush();
    }

    private function redigerTexte(Reservation $reservation): string
    {
        return $this->ia->generate(
            sprintf('Client : %s. Prestation : %s. Rédige une relance brève et chaleureuse (2-3 phrases) invitant à reprendre rendez-vous après un créneau manqué.',
                $reservation->getNomInvite() ?? '',
                $reservation->getPrestation()?->getNom() ?? '',
            ),
            ['usage' => 'relance', 'systeme' => 'Tu es un assistant relation client bienveillant.', 'maxTokens' => 300],
        );
    }
}

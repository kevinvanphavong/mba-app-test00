<?php

namespace App\Service;

use App\Dto\CreateReservationInput;
use App\Entity\Centre;
use App\Entity\Reservation;
use App\Exception\PrestationNonReservableException;
use App\Repository\PrestationRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Crée une réservation B2C invité : logique métier de la réservation (isolation,
 * tarification, persistance), hors du contrôleur (CLAUDE.md règle 7).
 *
 * Aucun paiement n'est traité ici : on fige le montant total et l'acompte dû, et la
 * réservation naît « en attente d'acompte ». Stripe sera branché plus tard.
 */
final class ReservationCreator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PrestationRepository $prestationRepository,
        private readonly CrmScheduler $crmScheduler,
        private readonly float $acompteRate = 0.20,
    ) {
    }

    /**
     * @throws PrestationNonReservableException si la prestation n'appartient pas au
     *                                          centre résolu (ou est inactive/inexistante)
     */
    public function create(Centre $centre, CreateReservationInput $input): Reservation
    {
        // Verrou cross-tenant : la prestation DOIT appartenir au centre résolu par le
        // host. Un id de prestation d'un autre centre ne résout rien → exception → 404.
        $prestation = $this->prestationRepository->findOneActiveForCentre((int) $input->prestationId, $centre);
        if (null === $prestation) {
            throw new PrestationNonReservableException();
        }

        // Montant figé à la résa, en centimes. Acompte = part paramétrable du total.
        $montantTotalCents = $prestation->getPrixCents() * (int) $input->nbPersonnes;
        $acompteCents = (int) round($montantTotalCents * $this->acompteRate);

        $reservation = (new Reservation())
            ->setCentre($centre)
            ->setPrestation($prestation)
            ->setDateCreneau($input->dateCreneau)
            ->setNbPersonnes((int) $input->nbPersonnes)
            ->setNomInvite(trim((string) $input->nom))
            ->setEmailInvite(strtolower(trim((string) $input->email)))
            ->setTelephoneInvite(trim((string) $input->telephone))
            ->setMontantTotalCents($montantTotalCents)
            ->setAcompteCents($acompteCents)
            ->setStatut(Reservation::STATUT_EN_ATTENTE_ACOMPTE);

        $this->em->persist($reservation);
        $this->em->flush();

        // Effets de bord CRM (contact, relance no-show, demande d'avis) via Messenger.
        $this->crmScheduler->planifierDepuisReservation($reservation);

        return $reservation;
    }
}

<?php

namespace App\Controller\Web;

use App\Dto\CreateReservationInput;
use App\Exception\PrestationNonReservableException;
use App\Service\CurrentCentreResolver;
use App\Service\ReservationCreator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Réservation B2C invité sur le site public d'un client (Branche 1).
 *
 * Zone publique `^/api/public` (firewall sans authenticator) : aucun JWT requis.
 * Le centre est résolu par le **host** (jamais par le client), comme le site public.
 * La validation des entrées et l'isolation par centre sont systématiques ; le
 * paiement n'est pas traité ici (statut « en attente d'acompte »).
 */
class PublicReservationController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly ReservationCreator $reservationCreator,
    ) {
    }

    #[Route('/api/public/reservations', name: 'public_reservation_create', methods: ['POST'])]
    public function create(#[MapRequestPayload] CreateReservationInput $input): JsonResponse
    {
        // Résolution par domaine uniquement (host réel). Host inconnu ou centre
        // désactivé → 404 : pas de site public, donc pas de réservation possible.
        $centre = $this->centreResolver->resolveByHost();
        if (null === $centre || !$centre->isActif()) {
            throw $this->createNotFoundException();
        }

        try {
            $reservation = $this->reservationCreator->create($centre, $input);
        } catch (PrestationNonReservableException) {
            // Prestation inconnue, inactive, ou d'un autre centre : 404 sans détail.
            throw $this->createNotFoundException('Prestation introuvable pour ce site.');
        }

        return $this->json([
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'prestation' => $reservation->getPrestation()?->getNom(),
            'dateCreneau' => $reservation->getDateCreneau()?->format(\DateTimeInterface::ATOM),
            'nbPersonnes' => $reservation->getNbPersonnes(),
            'montantTotalCents' => $reservation->getMontantTotalCents(),
            'acompteCents' => $reservation->getAcompteCents(),
        ], 201);
    }
}

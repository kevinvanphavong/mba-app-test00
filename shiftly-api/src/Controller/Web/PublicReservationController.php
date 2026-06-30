<?php

namespace App\Controller\Web;

use App\Dto\CreateReservationInput;
use App\Entity\Reservation;
use App\Exception\PrestationNonReservableException;
use App\Repository\ReservationRepository;
use App\Service\CurrentCentreResolver;
use App\Service\ReservationCreator;
use App\Service\ReservationPaymentService;
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
        private readonly ReservationRepository $reservations,
        private readonly ReservationPaymentService $paymentService,
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

    /**
     * Démarre le paiement de l'acompte : renvoie l'URL Stripe Checkout hébergée.
     * Isolation : la résa doit appartenir au centre résolu par host (sinon 404).
     */
    #[Route('/api/public/reservations/{id}/checkout', name: 'public_reservation_checkout', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function checkout(int $id): JsonResponse
    {
        $reservation = $this->ownReservationOr404($id);

        // Déjà payée : pas de nouvelle session (idempotence côté UX).
        if ($reservation->isConfirmee()) {
            return $this->json(['message' => 'Réservation déjà confirmée.'], 409);
        }

        return $this->json(['url' => $this->paymentService->createCheckoutUrl($reservation)]);
    }

    /**
     * Lecture publique du statut d'une réservation (page de retour succès/annulé).
     * Bornée au centre résolu par host ; ne renvoie aucune donnée d'un autre tenant.
     */
    #[Route('/api/public/reservations/{id}', name: 'public_reservation_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $reservation = $this->ownReservationOr404($id);

        return $this->json([
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'prestation' => $reservation->getPrestation()?->getNom(),
            'acompteCents' => $reservation->getAcompteCents(),
        ]);
    }

    /** Résout la réservation du centre courant (host), 404 sinon (anti cross-tenant). */
    private function ownReservationOr404(int $id): Reservation
    {
        $centre = $this->centreResolver->resolveByHost();
        if (null === $centre || !$centre->isActif()) {
            throw $this->createNotFoundException();
        }

        $reservation = $this->reservations->findOneForCentre($id, $centre);
        if (null === $reservation) {
            throw $this->createNotFoundException('Réservation introuvable pour ce site.');
        }

        return $reservation;
    }
}

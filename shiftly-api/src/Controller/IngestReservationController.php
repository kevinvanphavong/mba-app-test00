<?php

namespace App\Controller;

use App\Dto\IngestReservationInput;
use App\Security\IngestUser;
use App\Service\ReservationIngestor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Réception des réservations poussées par un système externe (site FGC → Shiftly).
 *
 * Sous `^/api/ingest` (firewall clé API + access_control ROLE_INGEST) + `#[IsGranted]`
 * de classe (défense en profondeur). Le centre vient de la clé (via {@see IngestUser}),
 * JAMAIS du payload. Le mapping/l'idempotence sont dans {@see ReservationIngestor}.
 * 201 = créée · 200 = déjà ingérée (idempotent) · 422 = payload invalide (MapRequestPayload).
 */
#[IsGranted('ROLE_INGEST')]
class IngestReservationController extends AbstractController
{
    public function __construct(private readonly ReservationIngestor $ingestor)
    {
    }

    #[Route('/api/ingest/reservations', name: 'ingest_reservations', methods: ['POST'])]
    public function __invoke(#[MapRequestPayload] IngestReservationInput $input): JsonResponse
    {
        /** @var IngestUser $user */
        $user = $this->getUser();

        $result = $this->ingestor->ingest($user->getCentre(), $input);
        $reservation = $result['reservation'];

        return $this->json([
            'id' => $reservation->getId(),
            'sourceRef' => $reservation->getSourceRef(),
            'statut' => $reservation->getStatut(),
            'created' => $result['created'],
        ], $result['created'] ? Response::HTTP_CREATED : Response::HTTP_OK);
    }
}

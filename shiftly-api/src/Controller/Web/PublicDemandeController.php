<?php

namespace App\Controller\Web;

use App\Dto\CreateDemandeB2BInput;
use App\Service\CurrentCentreResolver;
use App\Service\DemandeB2BCreator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Dépôt public d'une demande B2B sur le site d'un client (Branche 1).
 *
 * Zone publique `^/api/public` (sans auth, exemptée CSRF). Le centre est résolu par
 * le HOST (jamais par le client) et la demande lui est explicitement rattachée —
 * fail-closed : host inconnu ou centre inactif → 404. Validation systématique.
 * L'éventuel devis IA est best-effort (cf. DemandeB2BCreator) : la demande est
 * toujours enregistrée, même si l'IA est indisponible.
 */
class PublicDemandeController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly DemandeB2BCreator $creator,
    ) {
    }

    #[Route('/api/public/demandes', name: 'public_demande_create', methods: ['POST'])]
    public function create(#[MapRequestPayload] CreateDemandeB2BInput $input): JsonResponse
    {
        $centre = $this->centreResolver->resolveByHost();
        if (null === $centre || !$centre->isActif()) {
            throw $this->createNotFoundException();
        }

        $demande = $this->creator->create($centre, $input);

        return $this->json([
            'id' => $demande->getId(),
            'statut' => $demande->getStatut(),
            'message' => 'Votre demande a bien été transmise.',
        ], 201);
    }
}

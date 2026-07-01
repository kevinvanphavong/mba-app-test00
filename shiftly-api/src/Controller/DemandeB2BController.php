<?php

namespace App\Controller;

use App\Repository\DemandeB2BRepository;
use App\Service\CurrentCentreResolver;
use App\Service\DevisGenerator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Actions gérant sur les demandes B2B (hors API Platform).
 *
 * Relance de la génération de devis IA (ex. après un quota atteint). Isolation :
 * la demande doit appartenir au centre du gérant (résolu par JWT), sinon 404.
 * Les exceptions du quota IA (429) / IA indisponible (503) remontent proprement.
 */
#[IsGranted('ROLE_MANAGER')]
class DemandeB2BController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly DemandeB2BRepository $demandes,
        private readonly DevisGenerator $devisGenerator,
    ) {
    }

    #[Route('/api/demandes/{id}/generer-devis', name: 'demande_generer_devis', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function genererDevis(int $id): JsonResponse
    {
        $centre = $this->centreResolver->resolve();
        if (null === $centre) {
            throw $this->createNotFoundException();
        }

        // Verrou cross-tenant : demande d'un autre centre → introuvable.
        $demande = $this->demandes->findOneForCentre($id, $centre);
        if (null === $demande) {
            throw $this->createNotFoundException('Demande introuvable pour ce centre.');
        }

        // Les IaQuotaDepasseException (429) / IaIndisponibleException (503) remontent
        // telles quelles — refus propre, jamais d'exception nue.
        $devis = $this->devisGenerator->genererPour($demande);

        return $this->json([
            'devisId' => $devis->getId(),
            'statut' => $devis->getStatut(),
            'totalCents' => $devis->getTotalCents(),
            'nbLignes' => \count($devis->getLignes()),
        ], 201);
    }
}

<?php

namespace App\Controller\Web;

use App\Entity\Prestation;
use App\Repository\PrestationRepository;
use App\Service\CurrentCentreResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Site public minimal de la Branche 1 (module Web/Site).
 *
 * Première surface publique : un visiteur arrive sur le domaine d'un client
 * (ex. « bowling-tours.fr ») → on résout SON centre par le host et on expose, en
 * lecture seule, le nom du centre + ses prestations. Aucune authentification.
 *
 * **Fail-closed** : le centre est résolu uniquement par le host réel (jamais par un
 * paramètre client). Host inconnu (ou centre inactif) → 404, aucune donnée d'un
 * autre tenant ne peut transparaître.
 */
class PublicSiteController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly PrestationRepository $prestationRepository,
    ) {
    }

    #[Route('/api/public/site', name: 'public_site_show', methods: ['GET'])]
    public function show(): JsonResponse
    {
        // Résolution par domaine uniquement (host réel), jamais par paramètre client.
        $centre = $this->centreResolver->resolveByHost();

        // Host inconnu ou centre désactivé → 404 : un client absent ou coupé n'a
        // pas de site public, et on ne révèle jamais l'existence d'un autre centre.
        if (null === $centre || !$centre->isActif()) {
            throw $this->createNotFoundException();
        }

        $prestations = $this->prestationRepository->findPubliquesForCentre($centre);

        return $this->json([
            'centre' => $centre->getNom(),
            'prestations' => array_map(
                static fn (Prestation $p): array => [
                    'nom' => $p->getNom(),
                    'description' => $p->getDescription(),
                ],
                $prestations,
            ),
        ]);
    }
}

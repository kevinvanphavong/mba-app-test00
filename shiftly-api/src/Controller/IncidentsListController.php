<?php

namespace App\Controller;

use App\Entity\Incident;
use App\Entity\User;
use App\Repository\IncidentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * GET /api/incidents/list?centreId=X.
 *
 * Retourne TOUS les incidents d'un centre (ouverts, en cours, résolus)
 * avec toutes les données associées : créateur, zone, staff impliqués.
 * Réservé aux managers.
 */
#[IsGranted('ROLE_MANAGER')]
class IncidentsListController extends AbstractController
{
    public function __construct(
        private readonly IncidentRepository $incidentRepo,
    ) {
    }

    #[Route('/api/incidents/list', name: 'api_incidents_list', methods: ['GET'], format: 'json', priority: 10)]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $centreId = (int) $request->query->get('centreId');

        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $incidents = $this->incidentRepo->findAllByCentre($centreId);

        $result = array_map(function (Incident $i) {
            $creePar = $i->getUser();
            $zone = $i->getZone();

            $staffImpliques = array_map(fn (User $u) => [
                'id' => $u->getId(),
                'nom' => $u->getNom(),
                'prenom' => $u->getPrenom(),
                'avatarColor' => $u->getAvatarColor() ?? '#6b7280',
            ], $i->getStaffImpliques()->toArray());

            return [
                'id' => $i->getId(),
                'titre' => $i->getTitre(),
                'severite' => $i->getSeverite(),
                'statut' => $i->getStatut(),
                'createdAt' => $i->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'resolvedAt' => $i->getResolvedAt()?->format(\DateTimeInterface::ATOM),
                'service' => $i->getService()?->getId(),
                'zone' => $zone ? [
                    'id' => $zone->getId(),
                    'nom' => $zone->getNom(),
                    'couleur' => $zone->getCouleur(),
                ] : null,
                'creePar' => $creePar ? [
                    'id' => $creePar->getId(),
                    'nom' => $creePar->getNom(),
                    'prenom' => $creePar->getPrenom(),
                    'avatarColor' => $creePar->getAvatarColor() ?? '#6b7280',
                ] : null,
                'staffImpliques' => $staffImpliques,
            ];
        }, $incidents);

        return $this->json($result);
    }
}

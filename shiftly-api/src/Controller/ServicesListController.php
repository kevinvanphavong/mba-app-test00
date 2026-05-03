<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\MissionRepository;
use App\Repository\ServiceRepository;
use App\Repository\ZoneRepository;
use App\Service\ServiceStatutResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * GET /api/services/list?centreId=X
 *
 * Retourne la liste enrichie des services d'un centre :
 *  - données de base (date, heures, statut, tauxCompletion, note)
 *  - staff assigné (avatars)
 *  - toutes les zones du centre (même vides)
 *  - managers associés au service
 *
 * Triée par date décroissante.
 */
#[IsGranted('ROLE_USER')]
class ServicesListController extends AbstractController
{
    public function __construct(
        private readonly ServiceRepository    $serviceRepo,
        private readonly MissionRepository    $missionRepo,
        private readonly ZoneRepository       $zoneRepo,
        private readonly ServiceStatutResolver $statutResolver,
    ) {}

    #[Route('/api/services/list', name: 'api_services_list', methods: ['GET'], format: 'json', priority: 10)]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $centreId = (int) $request->query->get('centreId');

        // Multi-tenant guard
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $services = $this->serviceRepo->findByCentreDesc($centreId);

        // Toutes les zones du centre, triées par ordre
        $allZones = $this->zoneRepo->findBy(
            ['centre' => $currentUser->getCentre()],
            ['ordre' => 'ASC']
        );

        $result = [];

        foreach ($services as $service) {
            // Statut résolu en amont : conditionne le filtrage des zones (cf. plus bas)
            $statut = $this->statutResolver->resolve($service);

            // ── Postes groupés par zone ───────────────────────────────────────
            $postesByZone = []; // zoneId → [poste, ...]
            $staffSeen    = []; // userId → true (dédup)
            $staffList    = [];

            foreach ($service->getPostes() as $poste) {
                $zid = $poste->getZone()->getId();
                $postesByZone[$zid] ??= [];
                $postesByZone[$zid][] = $poste;

                $user = $poste->getUser();
                if ($user && !isset($staffSeen[$user->getId()])) {
                    $staffSeen[$user->getId()] = true;
                    $staffList[] = [
                        'id'          => $user->getId(),
                        'nom'         => $user->getNom(),
                        'prenom'      => $user->getPrenom(),
                        'avatarColor' => $user->getAvatarColor() ?? '#6b7280',
                    ];
                }
            }

            // ── Progression par zone ─────────────────────────────────────────
            // Pour PLANIFIE/EN_COURS : toutes les zones du centre (le manager peut
            // assigner du staff à une zone fraîchement créée).
            // Pour TERMINE : seulement les zones qui ont eu au moins un poste sur
            // ce service — évite que des zones créées après coup polluent
            // rétroactivement les services passés.
            $zonesData   = [];
            $globalTotal = 0;
            $globalDone  = 0;

            foreach ($allZones as $zone) {
                $zid    = $zone->getId();
                $postes = $postesByZone[$zid] ?? [];

                if ($statut === 'TERMINE' && count($postes) === 0) {
                    continue;
                }

                $missions = $this->missionRepo->findForService($zid, $service->getId());
                $total    = count($missions);

                // Déduplication des completions par missionId
                $doneMissionIds = [];
                foreach ($postes as $poste) {
                    foreach ($poste->getCompletions() as $completion) {
                        $doneMissionIds[$completion->getMission()->getId()] = true;
                    }
                }
                $completed = count($doneMissionIds);

                $taux = $total > 0 ? round($completed / $total * 100, 1) : 0.0;

                $globalTotal += $total;
                $globalDone  += $completed;

                $postesData = array_map(fn($p) => [
                    'posteId'     => $p->getId(),
                    'userId'      => $p->getUser()?->getId(),
                    'nom'         => $p->getUser()?->getNom() ?? '',
                    'prenom'      => $p->getUser()?->getPrenom(),
                    'avatarColor' => $p->getUser()?->getAvatarColor() ?? '#6b7280',
                ], $postes);

                $zonesData[] = [
                    'id'      => $zone->getId(),
                    'nom'     => $zone->getNom(),
                    'couleur' => $zone->getCouleur(),
                    'taux'    => $taux,
                    'postes'  => $postesData,
                ];
            }

            // Taux de completion global calculé dynamiquement
            $globalTaux = $globalTotal > 0 ? round($globalDone / $globalTotal * 100, 1) : 0.0;

            // Managers du service
            $managers = array_map(fn(User $m) => [
                'id'          => $m->getId(),
                'nom'         => $m->getNom(),
                'avatarColor' => $m->getAvatarColor() ?? '#f97316',
            ], $service->getManagers()->toArray());

            $result[] = [
                'id'             => $service->getId(),
                'date'           => $service->getDate()?->format('Y-m-d'),
                'heureDebut'     => $service->getHeureDebut()?->format('H:i'),
                'heureFin'       => $service->getHeureFin()?->format('H:i'),
                'statut'         => $statut,
                'tauxCompletion' => $globalTaux,
                'note'           => $service->getNote(),
                'staff'          => $staffList,
                'zones'          => $zonesData,
                'managers'       => $managers,
            ];
        }

        return $this->json($result);
    }
}

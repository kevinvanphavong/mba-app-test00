<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\MissionRepository;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use App\Service\ServiceStatutResolver;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * GET /api/service/today?centreId=1
 *
 * Retourne les données complètes du service du jour pour la page /service :
 *  - meta du service
 *  - zones (chacune avec ses postes = staff assigné, et ses missions dédupliquées)
 *  - staff du centre (pour la modale incident)
 *
 * Les missions sont regroupées par zone (pas par poste) pour éviter les doublons
 * lorsque plusieurs membres sont assignés à la même zone.
 * Chaque mission indique qui l'a cochée via completedBy.
 */
#[IsGranted('ROLE_USER')]
class ServiceTodayController extends AbstractController
{
    /** Ordre d'affichage des catégories : OUVERTURE → PENDANT → MENAGE → FERMETURE */
    private const CATEGORIE_ORDER = [
        'OUVERTURE' => 0,
        'PENDANT'   => 1,
        'MENAGE'    => 2,
        'FERMETURE' => 3,
    ];

    public function __construct(
        private readonly ServiceRepository    $serviceRepo,
        private readonly MissionRepository    $missionRepo,
        private readonly UserRepository       $userRepo,
        private readonly ServiceStatutResolver $statutResolver,
    ) {}

    #[Route('/api/service/today', name: 'api_service_today', methods: ['GET'], format: 'json')]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $centreId = (int) $request->query->get('centreId');

        // Multi-tenant guard
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $service = $this->serviceRepo->findTodayActive($centreId);

        if (!$service) {
            return $this->json(['service' => null, 'zones' => [], 'staff' => []]);
        }

        // ── Grouper les postes par zone ───────────────────────────────────────
        $postesByZone = []; // zoneId → [poste, ...]
        $zonesMeta    = []; // zoneId → zone entity

        foreach ($service->getPostes() as $poste) {
            $zone = $poste->getZone();
            $zid  = $zone->getId();

            $zonesMeta[$zid]    ??= $zone;
            $postesByZone[$zid] ??= [];
            $postesByZone[$zid][] = $poste;
        }

        // Tri des zones par ordre
        uksort($postesByZone, fn($a, $b) =>
            ($zonesMeta[$a]->getOrdre() ?? 0) <=> ($zonesMeta[$b]->getOrdre() ?? 0)
        );

        // ── Construction des zones avec missions dédupliquées ─────────────────
        $zonesData = [];

        foreach ($postesByZone as $zid => $postes) {
            $zone = $zonesMeta[$zid];

            // Missions de la zone : FIXE + PONCTUELLES liées à ce service
            $missions = $this->missionRepo->findForService($zid, $service->getId());

            // Trier : catégorie (OUVERTURE→PENDANT→MENAGE→FERMETURE) puis ordre interne
            usort($missions, function ($a, $b) {
                $orderA = self::CATEGORIE_ORDER[$a->getCategorie()] ?? 99;
                $orderB = self::CATEGORIE_ORDER[$b->getCategorie()] ?? 99;
                return $orderA !== $orderB
                    ? $orderA <=> $orderB
                    : $a->getOrdre() <=> $b->getOrdre();
            });

            // Map missionId → {completionId, completedByUser, hasPhoto}
            // Aggrège les completions de TOUS les postes de la zone (premier trouvé gagne)
            $completionMap = []; // missionId → ['id' => int, 'user' => User|null, 'hasPhoto' => bool]
            foreach ($postes as $poste) {
                foreach ($poste->getCompletions() as $completion) {
                    $mid = $completion->getMission()->getId();
                    if (!isset($completionMap[$mid])) {
                        $completionMap[$mid] = [
                            'id'       => $completion->getId(),
                            'user'     => $completion->getUser(),
                            'hasPhoto' => $completion->getPhotoPath() !== null,
                        ];
                    }
                }
            }

            // Staff de la zone (un objet par poste)
            $postesList = array_map(function ($poste) {
                $user = $poste->getUser();
                return [
                    'id'   => $poste->getId(),
                    'user' => $user ? [
                        'id'          => $user->getId(),
                        'nom'         => $user->getNom(),
                        'prenom'      => $user->getPrenom(),
                        'role'        => $user->getRole(),
                        'avatarColor' => $user->getAvatarColor() ?? '#6b7280',
                    ] : null,
                ];
            }, $postes);

            // Missions dédupliquées avec completedBy + flag photo
            $missionsData = array_map(function ($m) use ($completionMap) {
                $completion   = $completionMap[$m->getId()] ?? null;
                $completedBy  = $completion ? $completion['user'] : null;

                return [
                    'id'            => $m->getId(),
                    'texte'         => $m->getTexte(),
                    'categorie'     => $m->getCategorie(),
                    'frequence'     => $m->getFrequence(),
                    'priorite'      => $m->getPriorite(),
                    'ordre'         => $m->getOrdre(),
                    'requiresPhoto' => $m->getRequiresPhoto(),
                    'completionId'  => $completion ? $completion['id'] : null,
                    'hasPhoto'      => $completion ? $completion['hasPhoto'] : false,
                    'completedBy'   => $completedBy ? [
                        'id'          => $completedBy->getId(),
                        'nom'         => $completedBy->getNom(),
                        'prenom'      => $completedBy->getPrenom(),
                        'avatarColor' => $completedBy->getAvatarColor() ?? '#6b7280',
                    ] : null,
                ];
            }, $missions);

            $zonesData[] = [
                'id'       => $zone->getId(),
                'nom'      => $zone->getNom(),
                'couleur'  => $zone->getCouleur(),
                'ordre'    => $zone->getOrdre(),
                'postes'   => $postesList,
                'missions' => $missionsData,
            ];
        }

        // ── Staff du centre (pour modale incident) ────────────────────────────
        $staffList = array_map(fn(User $u) => [
            'id'          => $u->getId(),
            'nom'         => $u->getNom(),
            'prenom'      => $u->getPrenom(),
            'role'        => $u->getRole(),
            'avatarColor' => $u->getAvatarColor() ?? '#6b7280',
        ], $this->userRepo->findByCentre($centreId));

        return $this->json([
            'service' => [
                'id'         => $service->getId(),
                'date'       => $service->getDate()?->format('Y-m-d'),
                'heureDebut' => $service->getHeureDebut()?->format('H:i') ?? '00:00',
                'heureFin'   => $service->getHeureFin()?->format('H:i') ?? '00:00',
                'statut'     => $this->statutResolver->resolve($service),
                'centreName' => $service->getCentre()?->getNom() ?? '',
                'note'       => $service->getNote(),
            ],
            'zones' => $zonesData,
            'staff' => $staffList,
        ]);
    }
}

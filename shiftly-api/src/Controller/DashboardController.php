<?php

namespace App\Controller;

use App\Entity\Incident;
use App\Entity\Service;
use App\Entity\User;
use App\Repository\CompletionRepository;
use App\Repository\IncidentRepository;
use App\Repository\MissionRepository;
use App\Repository\ServiceRepository;
use App\Repository\TutorielRepository;
use App\Repository\TutoReadRepository;
use App\Repository\UserRepository;
use App\Service\ServiceStatutResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
class DashboardController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface  $em,
        private readonly ServiceRepository       $serviceRepo,
        private readonly UserRepository          $userRepo,
        private readonly IncidentRepository      $incidentRepo,
        private readonly TutorielRepository      $tutorielRepo,
        private readonly TutoReadRepository      $tutoReadRepo,
        private readonly CompletionRepository    $completionRepo,
        private readonly MissionRepository       $missionRepo,
        private readonly ServiceStatutResolver   $statutResolver,
    ) {}

    /**
     * GET /api/dashboard/{centreId}
     *
     * Retourne en une seule requête toutes les données du dashboard :
     *  - service du jour (statut, postes, taux completion corrigé)
     *  - staff actif (users avec actif = true dans le centre)
     *  - incidents ouverts (tous, avec zone rattachée)
     *  - top staff (classement par points, avec rôle)
     *  - taux tutoriels (lectures / total par centre)
     *  - stats globales (moyenne completion de tous les services)
     */
    #[Route('/api/dashboard/{centreId}', name: 'api_dashboard', methods: ['GET'], format: 'json')]
    public function __invoke(int $centreId): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        // Multi-tenant guard — un employé ne peut consulter que son centre
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        return $this->json([
            'service'    => $this->buildServiceSection($centreId),
            'staff'      => $this->buildStaffSection($centreId),
            'incidents'  => $this->buildIncidentsSection($centreId),
            'topStaff'   => $this->buildTopStaff($centreId),
            'tutoriels'  => $this->buildTutorielsSection($centreId),
            'stats'      => $this->buildServicesStats($centreId),
        ]);
    }

    // -------------------------------------------------------------------------

    /**
     * Service du jour — taux de complétion corrigé.
     *
     * Utilise findForService (FIXE + PONCTUELLES) et déduplique par zone
     * pour éviter le double-comptage lorsque plusieurs postes couvrent la même zone.
     */
    private function buildServiceSection(int $centreId): array
    {
        $service = $this->serviceRepo->findTodayActive($centreId);
        if (!$service) {
            return [
                'today'            => null,
                'tauxCompletion'   => 0.0,
                'staffActifCount'  => 0,
                'totalMissions'    => 0,
                'pointsStaffActif' => 0,
            ];
        }

        // Grouper les postes par zone + collecter le staff unique
        $postesByZone = []; // zoneId → ['zone' => Zone, 'postes' => [Poste, ...]]
        $staffSeen    = []; // userId → User (déduplication, ordre d'apparition préservé)
        $pointsTotal  = 0;

        foreach ($service->getPostes() as $poste) {
            $zone = $poste->getZone();
            $zid  = $zone->getId();
            $postesByZone[$zid] ??= ['zone' => $zone, 'postes' => []];
            $postesByZone[$zid]['postes'][] = $poste;

            $user = $poste->getUser();
            if ($user && !isset($staffSeen[$user->getId()])) {
                $staffSeen[$user->getId()] = $user;
                $pointsTotal += $user->getPoints();
            }
        }

        $totalMissions = 0;
        $doneCount     = 0;
        $zonesPayload  = [];

        foreach ($postesByZone as $zid => $data) {
            // Missions FIXE + PONCTUELLES (cohérent avec ServiceTodayController)
            $missions       = $this->missionRepo->findForService($zid, $service->getId());
            $zoneTotal      = count($missions);
            $totalMissions += $zoneTotal;

            // Déduplication des completions par missionId (plusieurs postes même zone)
            $completedIds = [];
            foreach ($data['postes'] as $poste) {
                foreach ($poste->getCompletions() as $completion) {
                    $completedIds[$completion->getMission()->getId()] = true;
                }
            }
            $zoneDone = count($completedIds);
            $doneCount += $zoneDone;

            $zone = $data['zone'];
            $zonesPayload[] = [
                'id'        => $zone->getId(),
                'nom'       => $zone->getNom(),
                'couleur'   => $zone->getCouleur() ?? '#6b7280',
                'completed' => $zoneDone,
                'total'     => $zoneTotal,
                'pct'       => $zoneTotal > 0 ? round($zoneDone / $zoneTotal * 100, 1) : 0.0,
            ];
        }

        // Tri : pct ASC (zone la plus en retard en haut), tie-break nom ASC
        usort($zonesPayload, static function (array $a, array $b): int {
            return $a['pct'] <=> $b['pct'] ?: strcmp($a['nom'], $b['nom']);
        });

        $taux = $totalMissions > 0 ? round($doneCount / $totalMissions * 100, 1) : 0.0;

        return [
            'today' => [
                'id'         => $service->getId(),
                'date'       => $service->getDate()?->format('Y-m-d'),
                'heureDebut' => $service->getHeureDebut()?->format('H:i'),
                'heureFin'   => $service->getHeureFin()?->format('H:i'),
                'statut'     => $this->statutResolver->resolve($service),
                'nbPostes'   => $service->getPostes()->count(),
                'zones'      => $zonesPayload,
                'managersResponsables' => array_map(static fn (User $u) => [
                    'id'     => $u->getId(),
                    'nom'    => $u->getNom(),
                    'prenom' => $u->getPrenom(),
                ], $service->getManagers()->toArray()),
                'staffEnService' => array_values(array_map(static fn (User $u) => [
                    'id'          => $u->getId(),
                    'nom'         => $u->getNom(),
                    'prenom'      => $u->getPrenom(),
                    'avatarColor' => $u->getAvatarColor() ?? '#6b7280',
                ], $staffSeen)),
            ],
            'tauxCompletion'   => $taux,
            'staffActifCount'  => $this->userRepo->countActifByCentre($centreId),
            'totalMissions'    => $totalMissions,
            'pointsStaffActif' => $pointsTotal,
        ];
    }

    /** Nombre de users du centre créés depuis le 1er du mois en cours (Europe/Paris). */
    private function countNouveauxCeMois(int $centreId): int
    {
        $startOfMonth = (new \DateTimeImmutable('first day of this month', new \DateTimeZone('Europe/Paris')))
            ->setTime(0, 0, 0);

        return (int) $this->em->createQuery(
            'SELECT COUNT(u.id) FROM App\Entity\User u
             WHERE u.centre = :centreId
               AND u.createdAt >= :start'
        )
            ->setParameter('centreId', $centreId)
            ->setParameter('start', $startOfMonth)
            ->getSingleScalarResult();
    }

    private function buildStaffSection(int $centreId): array
    {
        $staff = $this->userRepo->findByCentre($centreId);

        return [
            'members' => array_map(fn(User $u) => [
                'id'          => $u->getId(),
                'nom'         => $u->getNom(),
                'prenom'      => $u->getPrenom(),
                'role'        => $u->getRole(),
                'avatarColor' => $u->getAvatarColor(),
                'points'      => $u->getPoints(),
            ], $staff),
            'nouveauxCeMois' => $this->countNouveauxCeMois($centreId),
        ];
    }

    /**
     * Incidents ouverts — retourne TOUS les incidents open individuellement
     * avec leur zone rattachée.
     */
    private function buildIncidentsSection(int $centreId): array
    {
        $open  = $this->incidentRepo->findOpenByCentre($centreId);
        $bySev = $this->incidentRepo->countBySeverite($centreId);

        $sevMap = [];
        foreach ($bySev as $row) {
            $sevMap[$row['severite']] = (int) $row['total'];
        }

        return [
            'total'   => count($open),
            'haute'   => $sevMap[Incident::SEV_HAUTE]   ?? 0,
            'moyenne' => $sevMap[Incident::SEV_MOYENNE]  ?? 0,
            'basse'   => $sevMap[Incident::SEV_BASSE]    ?? 0,
            'alertes' => array_map(function (Incident $i) {
                $creePar = $i->getUser();
                $zone    = $i->getZone();
                return [
                    'id'        => $i->getId(),
                    'titre'     => $i->getTitre(),
                    'severite'  => $i->getSeverite(),
                    'statut'    => $i->getStatut(),
                    'service'   => $i->getService()?->getId(),
                    'zone'      => $zone ? [
                        'id'      => $zone->getId(),
                        'nom'     => $zone->getNom(),
                        'couleur' => $zone->getCouleur(),
                    ] : null,
                    'createdAt' => $i->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                    'creePar'   => $creePar ? [
                        'id'          => $creePar->getId(),
                        'nom'         => $creePar->getNom(),
                        'prenom'      => $creePar->getPrenom(),
                        'avatarColor' => $creePar->getAvatarColor() ?? '#6b7280',
                    ] : null,
                    'staffImpliques' => array_map(fn(User $u) => [
                        'id'          => $u->getId(),
                        'nom'         => $u->getNom(),
                        'prenom'      => $u->getPrenom(),
                        'avatarColor' => $u->getAvatarColor() ?? '#6b7280',
                    ], $i->getStaffImpliques()->toArray()),
                ];
            }, $open),
        ];
    }

    /** Top staff — classement par points, inclut le rôle pour le filtrage côté front */
    private function buildTopStaff(int $centreId, int $limit = 20): array
    {
        $leaders = $this->userRepo->findLeaderboard($centreId);

        return array_map(fn(User $u) => [
            'id'          => $u->getId(),
            'nom'         => $u->getNom(),
            'prenom'      => $u->getPrenom(),
            'role'        => $u->getRole(),
            'avatarColor' => $u->getAvatarColor(),
            'points'      => $u->getPoints(),
        ], array_slice($leaders, 0, $limit));
    }

    private function buildTutorielsSection(int $centreId): array
    {
        $tutoriels = $this->tutorielRepo->findByCentre($centreId);
        $total     = count($tutoriels);

        if ($total === 0) {
            return ['total' => 0, 'tauxLecture' => 0.0];
        }

        // Lectures uniques (user × tutoriel) pour ce centre
        $lecturesCount = (int) $this->em->createQuery(
            'SELECT COUNT(tr.id) FROM App\Entity\TutoRead tr
             JOIN tr.tutoriel t
             WHERE t.centre = :centreId'
        )->setParameter('centreId', $centreId)->getSingleScalarResult();

        $staffCount  = count($this->userRepo->findByCentre($centreId));
        $maxLectures = $total * max(1, $staffCount);

        return [
            'total'       => $total,
            'lectures'    => $lecturesCount,
            'tauxLecture' => round($lecturesCount / $maxLectures * 100, 1),
        ];
    }

    /**
     * Statistiques globales des services — moyenne de complétion sur tous les services créés.
     */
    private function buildServicesStats(int $centreId): array
    {
        $services = $this->serviceRepo->findByCentreDesc($centreId);

        if (empty($services)) {
            return ['moyenneCompletion' => 0.0, 'totalServices' => 0];
        }

        $cumul = 0.0;

        foreach ($services as $service) {
            $postesByZone = [];
            foreach ($service->getPostes() as $poste) {
                $zid = $poste->getZone()->getId();
                $postesByZone[$zid] ??= ['zone' => $poste->getZone(), 'postes' => []];
                $postesByZone[$zid]['postes'][] = $poste;
            }

            $totalM = 0;
            $doneM  = 0;
            foreach ($postesByZone as $zid => $data) {
                $missions = $this->missionRepo->findForService($zid, $service->getId());
                $totalM  += count($missions);
                $done = [];
                foreach ($data['postes'] as $poste) {
                    foreach ($poste->getCompletions() as $c) {
                        $done[$c->getMission()->getId()] = true;
                    }
                }
                $doneM += count($done);
            }

            $cumul += $totalM > 0 ? ($doneM / $totalM * 100) : 0.0;
        }

        $nbServices = count($services);

        return [
            'moyenneCompletion' => round($cumul / $nbServices, 1),
            'totalServices'     => $nbServices,
        ];
    }
}

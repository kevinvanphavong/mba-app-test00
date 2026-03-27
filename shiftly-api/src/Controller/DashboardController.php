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
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_USER')]
class DashboardController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ServiceRepository      $serviceRepo,
        private readonly UserRepository         $userRepo,
        private readonly IncidentRepository     $incidentRepo,
        private readonly TutorielRepository     $tutorielRepo,
        private readonly TutoReadRepository     $tutoReadRepo,
        private readonly CompletionRepository   $completionRepo,
        private readonly MissionRepository      $missionRepo,
    ) {}

    /**
     * GET /api/dashboard/{centreId}
     *
     * Retourne en une seule requête toutes les données du dashboard :
     *  - service du jour (statut, postes, taux occupation)
     *  - staff actif (connecté aujourd'hui ou tout le staff du centre)
     *  - incidents ouverts (count + par sévérité + alertes haute)
     *  - top staff (classement par points)
     *  - taux tutoriels (lectures / total par centre)
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
        ]);
    }

    // -------------------------------------------------------------------------

    private function buildServiceSection(int $centreId): array
    {
        $service = $this->serviceRepo->findTodayActive($centreId);
        if (!$service) {
            return ['today' => null, 'tauxOccupation' => 0.0];
        }

        $postes     = $service->getPostes();
        $totalMissions = 0;
        $doneCount  = 0;

        foreach ($postes as $poste) {
            // Compte toutes les missions de la zone du poste
            $missions      = $this->missionRepo->findByZone($poste->getZone()->getId());
            $totalMissions += count($missions);
            $doneCount     += $poste->getCompletions()->count();
        }

        $taux = $totalMissions > 0 ? round($doneCount / $totalMissions * 100, 1) : 0.0;

        return [
            'today' => [
                'id'         => $service->getId(),
                'date'       => $service->getDate()?->format('Y-m-d'),
                'heureDebut' => $service->getHeureDebut()?->format('H:i'),
                'heureFin'   => $service->getHeureFin()?->format('H:i'),
                'statut'     => $service->getStatut(),
                'nbPostes'   => $postes->count(),
            ],
            'tauxOccupation' => $taux,
        ];
    }

    private function buildStaffSection(int $centreId): array
    {
        $staff = $this->userRepo->findByCentre($centreId);

        return array_map(fn(User $u) => [
            'id'         => $u->getId(),
            'nom'        => $u->getNom(),
            'role'       => $u->getRole(),
            'avatarColor'=> $u->getAvatarColor(),
            'points'     => $u->getPoints(),
        ], $staff);
    }

    private function buildIncidentsSection(int $centreId): array
    {
        $open      = $this->incidentRepo->findOpenByCentre($centreId);
        $bySev     = $this->incidentRepo->countBySeverite($centreId);
        $alertes   = array_filter($open, fn(Incident $i) => $i->getSeverite() === Incident::SEV_HAUTE);

        // Indexer countBySeverite par clé
        $sevMap = [];
        foreach ($bySev as $row) {
            $sevMap[$row['severite']] = (int) $row['total'];
        }

        return [
            'total'   => count($open),
            'haute'   => $sevMap[Incident::SEV_HAUTE]   ?? 0,
            'moyenne' => $sevMap[Incident::SEV_MOYENNE]  ?? 0,
            'basse'   => $sevMap[Incident::SEV_BASSE]    ?? 0,
            'alertes' => array_values(array_map(fn(Incident $i) => [
                'id'       => $i->getId(),
                'titre'    => $i->getTitre(),
                'severite' => $i->getSeverite(),
                'statut'   => $i->getStatut(),
                'service'  => $i->getService()?->getId(),
                'createdAt'=> $i->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            ], $alertes)),
        ];
    }

    private function buildTopStaff(int $centreId, int $limit = 5): array
    {
        $leaders = $this->userRepo->findLeaderboard($centreId);

        return array_map(fn(User $u) => [
            'id'         => $u->getId(),
            'nom'        => $u->getNom(),
            'avatarColor'=> $u->getAvatarColor(),
            'points'     => $u->getPoints(),
        ], array_slice($leaders, 0, $limit));
    }

    private function buildTutorielsSection(int $centreId): array
    {
        $tutoriels = $this->tutorielRepo->findByCentre($centreId);
        $total     = count($tutoriels);

        if ($total === 0) {
            return ['total' => 0, 'tauxLecture' => 0.0];
        }

        // Compte les lectures uniques (user × tutoriel) pour ce centre
        $lecturesCount = (int) $this->em->createQuery(
            'SELECT COUNT(tr.id) FROM App\Entity\TutoRead tr
             JOIN tr.tutoriel t
             WHERE t.centre = :centreId'
        )->setParameter('centreId', $centreId)->getSingleScalarResult();

        $staffCount = count($this->userRepo->findByCentre($centreId));
        $maxLectures = $total * max(1, $staffCount);

        return [
            'total'       => $total,
            'lectures'    => $lecturesCount,
            'tauxLecture' => round($lecturesCount / $maxLectures * 100, 1),
        ];
    }
}

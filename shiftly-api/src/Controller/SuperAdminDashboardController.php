<?php

namespace App\Controller;

use App\Entity\Centre;
use App\Repository\AuditLogRepository;
use App\Repository\CentreRepository;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use App\Service\SentryApiService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminDashboardController extends AbstractController
{
    public function __construct(
        private readonly CentreRepository   $centreRepo,
        private readonly UserRepository     $userRepo,
        private readonly ServiceRepository  $serviceRepo,
        private readonly AuditLogRepository $auditLogRepo,
        private readonly SentryApiService   $sentryApi,
    ) {}

    #[Route('/api/superadmin/dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $totalCentres = count($this->centreRepo->findAll());
        $totalUsers   = count($this->userRepo->findAll());
        $recentLogs   = $this->auditLogRepo->findRecent(10);
        $sentryStats  = $this->sentryApi->getStats7Days();

        $activity = array_map(fn($log) => [
            'id'         => $log->getId(),
            'action'     => $log->getAction(),
            'targetType' => $log->getTargetType(),
            'targetId'   => $log->getTargetId(),
            'ip'         => $log->getIp(),
            'createdAt'  => $log->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], $recentLogs);

        // Top 5 centres par nombre de pointages sur 30j
        $since    = new \DateTimeImmutable('-30 days');
        $centres  = $this->centreRepo->findAll();
        $scored   = array_map(function (Centre $c) use ($since): array {
            $count = (int) $this->serviceRepo->createQueryBuilder('s')
                ->select('COUNT(p.id)')
                ->innerJoin('App\\Entity\\Pointage', 'p', 'WITH', 'p.service = s.id')
                ->where('s.centre = :centre')
                ->andWhere('s.date >= :since')
                ->setParameter('centre', $c)
                ->setParameter('since', $since)
                ->getQuery()->getSingleScalarResult();

            $users = $c->getUsers()->count();
            // Engagement approximatif : pointages par user (normalisé sur 40)
            $engagement = $users > 0 ? min(100, round(($count / $users) / 40 * 100)) : 0;

            return [
                'id'           => $c->getId(),
                'nom'          => $c->getNom(),
                'adresse'      => $c->getAdresse(),
                'totalUsers'   => $users,
                'pointages30j' => $count,
                'engagement'   => $engagement,
            ];
        }, $centres);

        usort($scored, fn($a, $b) => $b['pointages30j'] <=> $a['pointages30j']);
        $topCentres = array_slice($scored, 0, 5);

        return $this->json([
            'totalCentres'   => $totalCentres,
            'totalUsers'     => $totalUsers,
            'mrr'            => 0,
            'recentActivity' => $activity,
            'sentryStats'    => $sentryStats,
            'topCentres'     => $topCentres,
        ]);
    }
}

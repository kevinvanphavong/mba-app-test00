<?php

namespace App\Controller;

use App\Repository\AuditLogRepository;
use App\Repository\CentreRepository;
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
        private readonly CentreRepository  $centreRepo,
        private readonly UserRepository    $userRepo,
        private readonly AuditLogRepository $auditLogRepo,
        private readonly SentryApiService  $sentryApi,
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

        return $this->json([
            'totalCentres'   => $totalCentres,
            'totalUsers'     => $totalUsers,
            'mrr'            => 0,
            'recentActivity' => $activity,
            'sentryStats'    => $sentryStats,
        ]);
    }
}

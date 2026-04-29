<?php

namespace App\Controller;

use App\Exception\DelaiPrevenanceException;
use App\Repository\CentreRepository;
use App\Repository\PlanningSnapshotRepository;
use App\Service\PlanningService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/planning', name: 'planning_')]
class PlanningController extends AbstractController
{
    public function __construct(
        private readonly PlanningService           $planningService,
        private readonly CentreRepository          $centreRepository,
        private readonly PlanningSnapshotRepository $snapshotRepository,
    ) {}

    /**
     * GET /api/planning/week?centreId={id}&weekStart=YYYY-MM-DD
     * Retourne les données complètes d'une semaine de planning.
     */
    #[Route('/week', name: 'week', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function week(Request $request): JsonResponse
    {
        $centreId  = (int) $request->query->get('centreId', 0);
        $weekParam = $request->query->get('weekStart', '');

        if (!$centreId) {
            return $this->json(['error' => 'centreId requis'], 400);
        }

        // Garde multi-tenant
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $centre = $this->centreRepository->find($centreId);
        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable'], 404);
        }

        // Normalise weekStart au lundi de la semaine fournie
        $weekStart = $this->resolveMonday($weekParam);

        $data = $this->planningService->getWeekData($centre, $weekStart);

        return $this->json($data);
    }

    /**
     * POST /api/planning/publish
     * Body : { "weekStart": "2026-04-13", "motifModification"?: "...", "forcePublication"?: false }
     *
     * Garde-fou IDCC 1790 : retourne 422 si délai < 7j et forcePublication=false.
     * Crée automatiquement un PlanningSnapshot immuable après publication.
     */
    #[Route('/publish', name: 'publish', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function publish(Request $request): JsonResponse
    {
        $body      = json_decode($request->getContent(), true);
        $weekParam = $body['weekStart']          ?? '';
        $motif     = $body['motifModification']  ?? null;
        $force     = (bool) ($body['forcePublication'] ?? false);

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        $centre      = $currentUser->getCentre();

        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable'], 404);
        }

        $weekStart = $this->resolveMonday($weekParam);

        try {
            $pw = $this->planningService->publishWeek($centre, $weekStart, $currentUser, $motif, $force);
        } catch (DelaiPrevenanceException $e) {
            $delai    = $e->getDelaiJours();
            $severity = $e->getSeverity();
            $message  = $severity === 'critique'
                ? "Le minimum exceptionnel de 3 jours calendaires est atteint. Vous publiez à {$delai} jour(s)."
                : "La Convention Collective IDCC 1790 impose 7 jours calendaires de prévenance. Vous publiez à {$delai} jours.";

            return $this->json([
                'warning'       => 'DELAI_PREVENANCE_NON_RESPECTE',
                'delaiJours'    => $delai,
                'message'       => $message,
                'severity'      => $severity,
                'requiresMotif' => true,
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        return $this->json([
            'weekStart'   => $pw->getWeekStart()->format('Y-m-d'),
            'statut'      => $pw->getStatut(),
            'publishedAt' => $pw->getPublishedAt()?->format(\DATE_ATOM),
        ]);
    }

    /**
     * GET /api/planning/snapshots?centreId={id}&weekStart=YYYY-MM-DD
     * Historique des publications immuables d'une semaine (archivage légal).
     */
    #[Route('/snapshots', name: 'snapshots', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function snapshots(Request $request): JsonResponse
    {
        $centreId  = (int) $request->query->get('centreId', 0);
        $weekParam = $request->query->get('weekStart', '');

        if (!$centreId) {
            return $this->json(['error' => 'centreId requis'], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $weekStart = $this->resolveMonday($weekParam);
        $snapshots = $this->snapshotRepository->findByWeek($centreId, $weekStart);

        return $this->json(array_map(fn($s) => [
            'id'                => $s->getId(),
            'weekStart'         => $s->getWeekStart()->format('Y-m-d'),
            'publishedAt'       => $s->getPublishedAt()->format(\DATE_ATOM),
            'publishedByNom'    => $s->getPublishedBy()->getNom(),
            'motifModification' => $s->getMotifModification(),
            'delaiRespect'      => $s->isDelaiRespect(),
        ], $snapshots));
    }

    /**
     * GET /api/planning/published-snapshot?centreId={id}&weekStart=YYYY-MM-DD
     * Retourne le data du dernier snapshot publié pour cette semaine — c'est
     * littéralement ce que le staff voit dans son app. Utilisé par l'aperçu
     * staff côté manager pour comparer le live avec la version publiée.
     *
     * Réponse : { weekStart, publishedAt, publishedByNom, data: PlanningWeekData }
     * où data est le snapshot JSON complet figé au moment de la publication.
     */
    #[Route('/published-snapshot', name: 'published_snapshot', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function publishedSnapshot(Request $request): JsonResponse
    {
        $centreId  = (int) $request->query->get('centreId', 0);
        $weekParam = $request->query->get('weekStart', '');

        if (!$centreId) {
            return $this->json(['error' => 'centreId requis'], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $weekStart = $this->resolveMonday($weekParam);
        $snapshot  = $this->snapshotRepository->findLatestByWeek($centreId, $weekStart);

        if (!$snapshot) {
            return $this->json(['error' => 'Aucun snapshot publié pour cette semaine'], 404);
        }

        return $this->json([
            'weekStart'      => $snapshot->getWeekStart()->format('Y-m-d'),
            'publishedAt'    => $snapshot->getPublishedAt()->format(\DATE_ATOM),
            'publishedByNom' => $snapshot->getPublishedBy()->getNom(),
            'data'           => $snapshot->getData(),
        ]);
    }

    /**
     * POST /api/planning/duplicate
     * Body : { "sourceWeekStart": "2026-04-13", "targetWeekStart": "2026-04-20" }
     * Duplique les postes d'une semaine source vers une semaine cible.
     */
    #[Route('/duplicate', name: 'duplicate', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function duplicate(Request $request): JsonResponse
    {
        $body   = json_decode($request->getContent(), true);
        $source = $body['sourceWeekStart'] ?? '';
        $target = $body['targetWeekStart'] ?? '';

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        $centre      = $currentUser->getCentre();

        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable'], 404);
        }

        $sourceWeek = $this->resolveMonday($source);
        $targetWeek = $this->resolveMonday($target);

        if ($sourceWeek->format('Y-m-d') === $targetWeek->format('Y-m-d')) {
            return $this->json(['error' => 'Les semaines source et cible doivent être différentes.'], 400);
        }

        try {
            $this->planningService->duplicateWeek($centre, $sourceWeek, $targetWeek);
        } catch (\RuntimeException $e) {
            return $this->json(['error' => $e->getMessage()], 409);
        }

        return $this->json([
            'targetWeekStart' => $targetWeek->format('Y-m-d'),
            'message'         => 'Semaine dupliquée avec succès.',
        ]);
    }

    /**
     * GET /api/planning/employee
     * Vue employé : semaine en cours + 2 prochaines semaines publiées.
     * Accessible à tous les utilisateurs connectés (ROLE_USER).
     */
    #[Route('/employee', name: 'employee', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function employee(): JsonResponse
    {
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        $data        = $this->planningService->getEmployeeWeeks($currentUser);

        return $this->json($data);
    }

    /**
     * GET /api/planning/alerts?centreId={id}&weekStart=YYYY-MM-DD
     * Retourne uniquement les alertes de la semaine.
     */
    #[Route('/alerts', name: 'alerts', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function alerts(Request $request): JsonResponse
    {
        $centreId  = (int) $request->query->get('centreId', 0);
        $weekParam = $request->query->get('weekStart', '');

        if (!$centreId) {
            return $this->json(['error' => 'centreId requis'], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $centre = $this->centreRepository->find($centreId);
        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable'], 404);
        }

        $weekStart = $this->resolveMonday($weekParam);
        $alertes   = $this->planningService->getAlerts($centre, $weekStart);

        return $this->json($alertes);
    }

    /**
     * GET /api/planning/export-pdf?centreId={id}&weekStart=YYYY-MM-DD
     * Retourne le planning en PDF — document légal (Art. L3171-1 C. travail).
     */
    #[Route('/export-pdf', name: 'export_pdf', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function exportPdf(Request $request): Response
    {
        $centreId  = (int) $request->query->get('centreId', 0);
        $weekParam = $request->query->get('weekStart', '');

        if (!$centreId) {
            return $this->json(['error' => 'centreId requis'], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $centre = $this->centreRepository->find($centreId);
        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable'], 404);
        }

        $weekStart = $this->resolveMonday($weekParam);
        $pdf       = $this->planningService->generatePdf($centre, $weekStart);
        $filename  = sprintf('planning_%s.pdf', $weekStart->format('Y-m-d'));

        return new Response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Retourne le lundi de la semaine contenant la date donnée.
     * Si la date est invalide, retourne le lundi courant.
     */
    private function resolveMonday(string $dateStr): \DateTimeImmutable
    {
        try {
            $date = new \DateTimeImmutable($dateStr);
        } catch (\Exception) {
            $date = new \DateTimeImmutable();
        }

        // Calcule le lundi : ISO day of week, lundi = 1
        $dayOfWeek = (int) $date->format('N');
        if ($dayOfWeek !== 1) {
            $date = $date->modify('-' . ($dayOfWeek - 1) . ' days');
        }

        // Le modificateur | force minuit (sans lui, createFromFormat garde l'heure courante)
        return \DateTimeImmutable::createFromFormat('Y-m-d|', $date->format('Y-m-d'));
    }
}

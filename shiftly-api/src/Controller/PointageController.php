<?php

namespace App\Controller;

use App\Entity\Pointage;
use App\Entity\PointagePause;
use App\Entity\Service;
use App\Repository\PointageRepository;
use App\Service\PointageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_MANAGER')]
#[Route('/api/pointage')]
class PointageController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PointageRepository     $pointageRepository,
        private readonly PointageService        $pointageService,
    ) {}

    /**
     * GET /api/pointage/service/{serviceId}
     * Retourne les pointages du service (génère si premier appel) + stats.
     */
    #[Route('/service/{serviceId}', name: 'api_pointage_service', methods: ['GET'])]
    public function getByService(int $serviceId): JsonResponse
    {
        $service = $this->em->find(Service::class, $serviceId);
        if (!$service) {
            throw $this->createNotFoundException('Service introuvable.');
        }

        // Guard multi-tenant
        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($service->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException();
        }

        // Génère les pointages manquants (idempotent : créé pour les postes ajoutés
        // après le premier chargement, ou rattrape un service jamais ouvert).
        $this->pointageService->genererPointagesDepuisPostes($service);

        $pointages = $this->pointageRepository->findByService($serviceId);
        $stats     = $this->pointageService->calculerStats($pointages);

        return $this->json([
            'service'   => $this->serializeService($service),
            'pointages' => array_map(fn($p) => $this->serializePointage($p), $pointages),
            'stats'     => $stats,
        ]);
    }

    /**
     * POST /api/pointage/{id}/arrivee
     * Pointe l'arrivée d'un employé (avec vérification PIN).
     */
    #[Route('/{id}/arrivee', name: 'api_pointage_arrivee', methods: ['POST'])]
    public function arrivee(int $id, Request $request): JsonResponse
    {
        $pointage = $this->findPointageSecure($id);
        $body     = json_decode($request->getContent(), true) ?? [];

        if ($pointage->getStatut() !== Pointage::STATUT_PREVU) {
            throw new BadRequestHttpException('Ce pointage n\'est pas en statut PREVU.');
        }

        $this->pointageService->verifierCodePin(
            $pointage,
            $body['codePin'] ?? null,
            (bool) ($body['managerBypass'] ?? false)
        );

        $now = new \DateTimeImmutable('now');
        $pointage->setHeureArrivee($now);
        $pointage->setStatut(Pointage::STATUT_EN_COURS);
        $pointage->setUpdatedAt($now);

        if (!empty($body['commentaire'])) {
            $pointage->setCommentaire($body['commentaire']);
        }

        $this->em->flush();

        return $this->json([
            'id'           => $pointage->getId(),
            'statut'       => $pointage->getStatut(),
            'heureArrivee' => $now->format('c'),
            'minutesRetard' => $this->pointageService->minutesRetard($pointage),
        ]);
    }

    /**
     * POST /api/pointage/{id}/depart
     * Pointe le départ d'un employé (avec vérification PIN).
     */
    #[Route('/{id}/depart', name: 'api_pointage_depart', methods: ['POST'])]
    public function depart(int $id, Request $request): JsonResponse
    {
        $pointage = $this->findPointageSecure($id);
        $body     = json_decode($request->getContent(), true) ?? [];

        if (!in_array($pointage->getStatut(), [Pointage::STATUT_EN_COURS, Pointage::STATUT_EN_PAUSE], true)) {
            throw new BadRequestHttpException('Ce pointage doit être EN_COURS ou EN_PAUSE pour pointer le départ.');
        }

        $this->pointageService->verifierCodePin(
            $pointage,
            $body['codePin'] ?? null,
            (bool) ($body['managerBypass'] ?? false)
        );

        $now = new \DateTimeImmutable('now');

        // Clôture automatique de la pause en cours
        foreach ($pointage->getPauses() as $pause) {
            if ($pause->getHeureFin() === null) {
                $pause->setHeureFin($now);
            }
        }

        $pointage->setHeureDepart($now);
        $pointage->setStatut(Pointage::STATUT_TERMINE);
        $pointage->setUpdatedAt($now);

        if (!empty($body['commentaire'])) {
            $pointage->setCommentaire($body['commentaire']);
        }

        $this->em->flush();

        return $this->json([
            'id'             => $pointage->getId(),
            'statut'         => $pointage->getStatut(),
            'heureDepart'    => $now->format('c'),
            'dureeEffective' => $this->pointageService->calculerDureeEffective($pointage),
        ]);
    }

    /**
     * POST /api/pointage/{id}/pause/start
     * Démarre une pause (avec vérification PIN).
     */
    #[Route('/{id}/pause/start', name: 'api_pointage_pause_start', methods: ['POST'])]
    public function pauseStart(int $id, Request $request): JsonResponse
    {
        $pointage = $this->findPointageSecure($id);
        $body     = json_decode($request->getContent(), true) ?? [];

        if ($pointage->getStatut() !== Pointage::STATUT_EN_COURS) {
            throw new BadRequestHttpException('Ce pointage doit être EN_COURS pour démarrer une pause.');
        }

        $this->pointageService->verifierCodePin(
            $pointage,
            $body['codePin'] ?? null,
            (bool) ($body['managerBypass'] ?? false)
        );

        $now   = new \DateTimeImmutable('now');
        $pause = new PointagePause();
        $pause->setHeureDebut($now);
        $pause->setType(in_array($body['type'] ?? '', ['COURTE', 'REPAS'], true) ? $body['type'] : 'COURTE');

        $pointage->addPause($pause);
        $pointage->setStatut(Pointage::STATUT_EN_PAUSE);
        $pointage->setUpdatedAt($now);

        $this->em->persist($pause);
        $this->em->flush();

        return $this->json([
            'id'     => $pointage->getId(),
            'statut' => $pointage->getStatut(),
            'pause'  => [
                'id'         => $pause->getId(),
                'heureDebut' => $now->format('c'),
                'type'       => $pause->getType(),
            ],
        ]);
    }

    /**
     * POST /api/pointage/{id}/pause/end
     * Termine une pause (avec vérification PIN).
     */
    #[Route('/{id}/pause/end', name: 'api_pointage_pause_end', methods: ['POST'])]
    public function pauseEnd(int $id, Request $request): JsonResponse
    {
        $pointage = $this->findPointageSecure($id);
        $body     = json_decode($request->getContent(), true) ?? [];

        if ($pointage->getStatut() !== Pointage::STATUT_EN_PAUSE) {
            throw new BadRequestHttpException('Ce pointage n\'est pas EN_PAUSE.');
        }

        $this->pointageService->verifierCodePin(
            $pointage,
            $body['codePin'] ?? null,
            (bool) ($body['managerBypass'] ?? false)
        );

        $now         = new \DateTimeImmutable('now');
        $pauseEnCours = null;

        foreach ($pointage->getPauses() as $pause) {
            if ($pause->getHeureFin() === null) {
                $pause->setHeureFin($now);
                $pauseEnCours = $pause;
                break;
            }
        }

        if (!$pauseEnCours) {
            throw new BadRequestHttpException('Aucune pause en cours trouvée.');
        }

        $pointage->setStatut(Pointage::STATUT_EN_COURS);
        $pointage->setUpdatedAt($now);
        $this->em->flush();

        $duree = (int) round(
            ($now->getTimestamp() - $pauseEnCours->getHeureDebut()->getTimestamp()) / 60
        );

        return $this->json([
            'id'     => $pointage->getId(),
            'statut' => $pointage->getStatut(),
            'pause'  => [
                'id'       => $pauseEnCours->getId(),
                'heureFin' => $now->format('c'),
                'duree'    => $duree,
            ],
        ]);
    }

    /**
     * POST /api/pointage/{id}/absence
     * Marque un employé absent (manager uniquement, pas de PIN).
     */
    #[Route('/{id}/absence', name: 'api_pointage_absence', methods: ['POST'])]
    public function absence(int $id, Request $request): JsonResponse
    {
        $pointage = $this->findPointageSecure($id);
        $body     = json_decode($request->getContent(), true) ?? [];

        if ($pointage->getStatut() !== Pointage::STATUT_PREVU) {
            throw new BadRequestHttpException('Seul un pointage PREVU peut être marqué absent.');
        }

        $now = new \DateTimeImmutable('now');
        $pointage->setStatut(Pointage::STATUT_ABSENT);
        $pointage->setUpdatedAt($now);

        if (!empty($body['commentaire'])) {
            $pointage->setCommentaire($body['commentaire']);
        }

        $this->em->flush();

        return $this->json([
            'id'     => $pointage->getId(),
            'statut' => $pointage->getStatut(),
        ]);
    }

    /**
     * POST /api/pointage/cloturer-service/{serviceId}
     * Clôture tous les pointages ouverts du service (manager uniquement).
     */
    #[Route('/cloturer-service/{serviceId}', name: 'api_pointage_cloturer_service', methods: ['POST'])]
    public function cloturerService(int $serviceId): JsonResponse
    {
        $service = $this->em->find(Service::class, $serviceId);
        if (!$service) {
            throw $this->createNotFoundException('Service introuvable.');
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($service->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException();
        }

        $result = $this->pointageService->cloturerService($service);

        return $this->json($result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findPointageSecure(int $id): Pointage
    {
        $pointage = $this->em->find(Pointage::class, $id);
        if (!$pointage) {
            throw $this->createNotFoundException('Pointage introuvable.');
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();
        if ($pointage->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException();
        }

        return $pointage;
    }

    private function serializeService(Service $service): array
    {
        return [
            'id'         => $service->getId(),
            'date'       => $service->getDate()?->format('Y-m-d'),
            'heureDebut' => $service->getHeureDebut()?->format('H:i'),
            'heureFin'   => $service->getHeureFin()?->format('H:i'),
            'statut'     => $service->getStatut(),
        ];
    }

    private function serializePointage(Pointage $p): array
    {
        $poste = $p->getPoste();
        $user  = $p->getUser();

        $pauses = array_map(fn(PointagePause $pause) => [
            'id'         => $pause->getId(),
            'heureDebut' => $pause->getHeureDebut()->format('c'),
            'heureFin'   => $pause->getHeureFin()?->format('c'),
            'type'       => $pause->getType(),
        ], $p->getPauses()->toArray());

        return [
            'id'             => $p->getId(),
            'statut'         => $p->getStatut(),
            'heureArrivee'   => $p->getHeureArrivee()?->format('c'),
            'heureDepart'    => $p->getHeureDepart()?->format('c'),
            'dureeEffective' => $this->pointageService->calculerDureeEffective($p),
            'minutesRetard'  => $this->pointageService->minutesRetard($p),
            'commentaire'    => $p->getCommentaire(),
            'pauses'         => $pauses,
            'user'           => [
                'id'          => $user->getId(),
                'nom'         => $user->getNom(),
                'prenom'      => $user->getPrenom(),
                'avatarColor' => $user->getAvatarColor(),
                'role'        => $user->getRole(),
            ],
            'poste' => $poste ? [
                'id'           => $poste->getId(),
                'heureDebut'   => $poste->getHeureDebut()?->format('H:i'),
                'heureFin'     => $poste->getHeureFin()?->format('H:i'),
                'pauseMinutes' => $poste->getPauseMinutes(),
                'zone'         => $poste->getZone() ? [
                    'id'      => $poste->getZone()->getId(),
                    'nom'     => $poste->getZone()->getNom(),
                    'couleur' => $poste->getZone()->getCouleur() ?? '#6b7280',
                ] : null,
            ] : null,
        ];
    }
}

<?php

namespace App\Controller;

use App\Entity\Pointage;
use App\Entity\User;
use App\Repository\PointageRepository;
use App\Repository\ValidationHebdoRepository;
use App\Service\ValidationHebdoService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Routes de validation hebdomadaire.
 * Toutes les routes sont réservées au ROLE_MANAGER et filtrées par centre_id du JWT.
 */
#[IsGranted('ROLE_MANAGER')]
#[Route('/api/pointages/validation')]
class ValidationController extends AbstractController
{
    public function __construct(
        private readonly ValidationHebdoService    $validationService,
        private readonly ValidationHebdoRepository $validationRepo,
        private readonly PointageRepository        $pointageRepo,
    ) {}

    /**
     * GET /api/pointages/validation/semaine/{date}
     * Données complètes d'une semaine (date = lundi au format YYYY-MM-DD).
     */
    #[Route('/semaine/{date}', name: 'api_validation_semaine', methods: ['GET'])]
    public function getSemaine(string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $data = $this->validationService->getSemaineData($centreId, $lundi);

        // Enrichir avec les statuts de validation existants
        $validations = $this->validationRepo->findByCentreAndSemaine($centreId, $lundi);
        $statutIndex = [];
        foreach ($validations as $v) {
            $statutIndex[$v->getUser()->getId()] = $v->getStatut();
        }

        foreach ($data['employes'] as &$employe) {
            if (isset($statutIndex[$employe['userId']])) {
                $employe['statut'] = $statutIndex[$employe['userId']];
            }
        }

        // Statut global de la semaine
        $totalEmployes  = count($data['employes']);
        $nbValides      = count(array_filter($data['employes'], fn($e) => $e['statut'] === 'VALIDEE'));
        $hasEnCours     = !empty(array_filter($data['employes'], fn($e) => $e['statut'] === 'en_cours'));

        $data['statutSemaine'] = match (true) {
            $nbValides === $totalEmployes => 'validee',
            $hasEnCours                  => 'en_cours',
            default                      => 'en_attente',
        };

        return $this->json($data);
    }

    /**
     * GET /api/pointages/validation/kpis/{date}
     * Les 5 KPIs de la semaine.
     */
    #[Route('/kpis/{date}', name: 'api_validation_kpis', methods: ['GET'])]
    public function getKPIs(string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $data = $this->validationService->getSemaineData($centreId, $lundi);

        return $this->json($data['kpis']);
    }

    /**
     * GET /api/pointages/validation/alertes/{date}
     * Alertes légales calculées à la volée pour la semaine.
     */
    #[Route('/alertes/{date}', name: 'api_validation_alertes', methods: ['GET'])]
    public function getAlertes(string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $data    = $this->validationService->getSemaineData($centreId, $lundi);
        $alertes = $this->validationService->calculerAlertes($data['employes']);

        return $this->json($alertes);
    }

    /**
     * GET /api/pointages/validation/detail/{userId}/{date}
     * Détail jour par jour d'un employé pour la semaine.
     */
    #[Route('/detail/{userId}/{date}', name: 'api_validation_detail', methods: ['GET'])]
    public function getDetail(int $userId, string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $data = $this->validationService->getSemaineData($centreId, $lundi);

        $employe = null;
        foreach ($data['employes'] as $e) {
            if ($e['userId'] === $userId) {
                $employe = $e;
                break;
            }
        }

        if ($employe === null) {
            throw $this->createNotFoundException("Employé {$userId} non trouvé pour cette semaine.");
        }

        // Enrichir le statut depuis ValidationHebdo si la semaine a déjà été validée/corrigée
        $validation = $this->validationRepo->findOneByUserAndSemaine($centreId, $userId, $lundi);
        if ($validation !== null) {
            $employe['statut'] = $validation->getStatut();
        }

        // Ajouter l'historique des corrections sur les pointages de cet employé
        $pointagesDeSemaine = $this->pointageRepo->findByCentreAndDateRange($centreId, $lundi, $lundi->modify('+6 days'));
        $corrections        = [];

        foreach ($pointagesDeSemaine as $p) {
            if ($p->getUser()->getId() === $userId) {
                $cors = $this->validationService->getCorrectionsFormatees($p->getId());
                $corrections = array_merge($corrections, $cors);
            }
        }

        $employe['corrections'] = $corrections;

        return $this->json($employe);
    }

    /**
     * POST /api/pointages/validation/valider/{userId}/{date}
     * Valide les heures d'un employé pour la semaine.
     */
    #[Route('/valider/{userId}/{date}', name: 'api_validation_valider_employe', methods: ['POST'])]
    public function validerEmploye(int $userId, string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $validation = $this->validationService->validerEmploye($centreId, $userId, $lundi, $manager);

        return $this->json([
            'id'      => $validation->getId(),
            'userId'  => $userId,
            'semaine' => $lundi->format('Y-m-d'),
            'statut'  => $validation->getStatut(),
            'valideAt' => $validation->getValideAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * POST /api/pointages/validation/valider-semaine/{date}
     * Valide toute la semaine en une fois.
     */
    #[Route('/valider-semaine/{date}', name: 'api_validation_valider_semaine', methods: ['POST'])]
    public function validerSemaine(string $date): JsonResponse
    {
        /** @var User $manager */
        $manager  = $this->getUser();
        $centreId = $manager->getCentre()->getId();
        $lundi    = $this->parseLundi($date);

        $validations = $this->validationService->validerSemaine($centreId, $lundi, $manager);

        return $this->json([
            'valides'   => count($validations),
            'semaine'   => $lundi->format('Y-m-d'),
            'statut'    => 'VALIDEE',
        ]);
    }

    /**
     * POST /api/pointages/validation/correction
     * Applique une correction sur un pointage.
     * Body: { pointageId, champModifie, nouvelleValeur, motif }
     */
    #[Route('/correction', name: 'api_validation_correction', methods: ['POST'])]
    public function corrigerPointage(Request $request): JsonResponse
    {
        /** @var User $manager */
        $manager = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (!isset($data['pointageId'], $data['champModifie'], $data['nouvelleValeur'])) {
            return $this->json(['error' => 'Champs requis : pointageId, champModifie, nouvelleValeur'], 400);
        }

        // Vérifier que le pointage appartient au centre du manager
        $pointage = $this->pointageRepo->find($data['pointageId']);
        if ($pointage === null || $pointage->getCentre()->getId() !== $manager->getCentre()->getId()) {
            return $this->json(['error' => 'Pointage introuvable ou accès refusé.'], 404);
        }

        try {
            $correction = $this->validationService->corrigerPointage(
                $data['pointageId'],
                $data['champModifie'],
                $data['nouvelleValeur'],
                $data['motif'] ?? null,
                $manager
            );
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        return $this->json([
            'id'             => $correction->getId(),
            'pointageId'     => $correction->getPointage()->getId(),
            'champModifie'   => $correction->getChampModifie(),
            'ancienneValeur' => $correction->getAncienneValeur()?->format('Y-m-d H:i:s'),
            'nouvelleValeur' => $correction->getNouvelleValeur()?->format('Y-m-d H:i:s'),
            'motif'          => $correction->getMotif(),
            'createdAt'      => $correction->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private function parseLundi(string $date): \DateTimeImmutable
    {
        try {
            $dt = new \DateTimeImmutable($date);
        } catch (\Exception) {
            throw $this->createNotFoundException("Date invalide : {$date}");
        }

        return $this->validationService->getLundiDeLaSemaine($dt);
    }
}

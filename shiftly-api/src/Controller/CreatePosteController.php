<?php

namespace App\Controller;

use App\Entity\Centre;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\Zone;
use App\Entity\User;
use App\Service\PlanningGuardService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint custom pour affecter un membre à une zone pour un service.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/postes/create
 * Body minimal (Service du Jour) :
 *   { "serviceId": 5, "zoneId": 2, "userId": 12 }
 *
 * Body Planning (avec date + horaires) :
 *   { "date": "2026-04-14", "zoneId": 2, "userId": 12,
 *     "heureDebut": "09:00", "heureFin": "17:00", "pauseMinutes": 30 }
 *
 * Si date fournie sans serviceId → crée le Service automatiquement si absent.
 */
#[IsGranted('ROLE_MANAGER')]
class CreatePosteController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanningGuardService   $planningGuard,
    ) {}

    #[Route('/api/postes/create', name: 'api_poste_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $serviceId    = isset($body['serviceId'])    ? (int) $body['serviceId']    : null;
        $date         = $body['date']                ?? null;    // 'YYYY-MM-DD'
        $zoneId       = (int) ($body['zoneId']       ?? 0);
        $userId       = (int) ($body['userId']        ?? 0);
        $heureDebut   = $body['heureDebut']          ?? null;    // 'HH:mm'
        $heureFin     = $body['heureFin']            ?? null;    // 'HH:mm'
        $pauseMinutes = (int) ($body['pauseMinutes'] ?? 0);

        if ((!$serviceId && !$date) || !$zoneId || !$userId) {
            throw new BadRequestHttpException('(serviceId ou date), zoneId et userId sont requis.');
        }

        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $centre      = $currentUser->getCentre();

        // ── Résoudre le Service ──────────────────────────────────────────────
        if ($serviceId) {
            $service = $this->em->find(Service::class, $serviceId);
            if (!$service) {
                throw $this->createNotFoundException('Service introuvable.');
            }
        } else {
            $service = $this->findOrCreateService($centre, $date);
        }

        $zone = $this->em->find(Zone::class, $zoneId);
        $user = $this->em->find(User::class, $userId);

        if (!$zone || !$user) {
            throw $this->createNotFoundException('Zone ou User introuvable.');
        }

        // Guard multi-tenant
        if ($zone->getCentre()?->getId() !== $centre?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cette zone.');
        }
        if ($user->getCentre()?->getId() !== $centre?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cet utilisateur.');
        }

        $poste = new Poste();
        $poste->setService($service);
        $poste->setZone($zone);
        $poste->setUser($user);

        // Horaires planning (optionnels)
        if ($heureDebut) {
            $poste->setHeureDebut(\DateTimeImmutable::createFromFormat('H:i', $heureDebut) ?: null);
        }
        if ($heureFin) {
            $poste->setHeureFin(\DateTimeImmutable::createFromFormat('H:i', $heureFin) ?: null);
        }
        $poste->setPauseMinutes($pauseMinutes);

        try {
            $this->em->persist($poste);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Ce membre est déjà assigné à cette zone pour ce service.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json([
            'id'        => $poste->getId(),
            'serviceId' => $service->getId(),
            'user'      => [
                'id'          => $user->getId(),
                'nom'         => $user->getNom(),
                'role'        => $user->getRole(),
                'avatarColor' => $user->getAvatarColor() ?? '#6b7280',
            ],
        ], Response::HTTP_CREATED);
    }

    /** Trouve le service pour cette date+centre, ou en crée un avec statut PLANIFIE. */
    private function findOrCreateService(?Centre $centre, string $dateStr): Service
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateStr);
        if (!$date) {
            throw new BadRequestHttpException('Format de date invalide, attendu YYYY-MM-DD.');
        }

        $existing = $this->em->getRepository(Service::class)->findOneBy([
            'centre' => $centre,
            'date'   => $date,
        ]);

        if ($existing) {
            return $existing;
        }

        // Création implicite d'un service : on bloque si la date est antérieure
        // au service du jour. Service existant déjà = pas de check (on autorise
        // d'ajouter un poste sur le service du jour ou un service futur déjà en
        // place ; on ne crée juste pas de nouveau service dans le passé).
        $this->planningGuard->assertDateNotInPast($date);

        $service = new Service();
        $service->setCentre($centre);
        $service->setDate($date);
        $service->setStatut('PLANIFIE');

        // Pré-remplir les heures depuis les réglages du centre pour ce jour de la semaine
        $dayMap = ['1' => 'lundi', '2' => 'mardi', '3' => 'mercredi', '4' => 'jeudi', '5' => 'vendredi', '6' => 'samedi', '7' => 'dimanche'];
        $dayKey = $dayMap[$date->format('N')] ?? null;
        $hours  = $centre?->getOpeningHours() ?? [];

        $hd = null;
        $hf = null;
        if ($dayKey && !empty($hours[$dayKey])) {
            $day = $hours[$dayKey];
            if (!empty($day['ouverture'])) {
                $hd = \DateTimeImmutable::createFromFormat('H:i', $day['ouverture']) ?: null;
            }
            if (!empty($day['fermeture'])) {
                $hf = \DateTimeImmutable::createFromFormat('H:i', $day['fermeture']) ?: null;
            }
        }
        $service->setHeureDebut($hd ?? \DateTimeImmutable::createFromFormat('H:i', '00:00') ?: null);
        $service->setHeureFin($hf ?? \DateTimeImmutable::createFromFormat('H:i', '00:00') ?: null);

        $this->em->persist($service);
        // Flush différé — sera fait avec le Poste

        return $service;
    }
}

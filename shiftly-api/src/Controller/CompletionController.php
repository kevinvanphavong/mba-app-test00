<?php

namespace App\Controller;

use App\Entity\Completion;
use App\Entity\Mission;
use App\Entity\Poste;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint custom pour cocher une mission.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/completions/create  { "posteId": 28, "missionId": 137 }
 * → { "id": 42, "completedAt": "2026-03-26T..." }
 */
#[IsGranted('ROLE_USER')]
class CompletionController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/completions/create', name: 'api_completion_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $posteId   = (int) ($body['posteId']   ?? 0);
        $missionId = (int) ($body['missionId'] ?? 0);

        if (!$posteId || !$missionId) {
            throw new BadRequestHttpException('posteId et missionId sont requis.');
        }

        $poste   = $this->em->find(Poste::class, $posteId);
        $mission = $this->em->find(Mission::class, $missionId);

        if (!$poste || !$mission) {
            throw $this->createNotFoundException('Poste ou Mission introuvable.');
        }

        // Guard multi-tenant — le poste doit appartenir au centre de l'utilisateur connecté
        /** @var User $currentUser */
        $currentUser   = $this->getUser();
        $posteCentreId = $poste->getService()?->getCentre()?->getId();

        if ($posteCentreId !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à ce poste.');
        }

        // Crée la completion
        $completion = new Completion();
        $completion->setPoste($poste);
        $completion->setMission($mission);
        $completion->setUser($currentUser);

        $this->em->persist($completion);
        $this->em->flush();

        return $this->json([
            'id'          => $completion->getId(),
            'completedAt' => $completion->getCompletedAt()?->format(\DateTimeInterface::ATOM),
        ], 201);
    }
}

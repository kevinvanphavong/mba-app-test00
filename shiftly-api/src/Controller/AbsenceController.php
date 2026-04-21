<?php

namespace App\Controller;

use App\Entity\Absence;
use App\Repository\AbsenceRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/planning', name: 'planning_absence_')]
class AbsenceController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly AbsenceRepository      $absenceRepository,
        private readonly UserRepository         $userRepository,
    ) {}

    /**
     * POST /api/planning/absence
     * Crée une absence pour un employé sur une date donnée.
     */
    #[Route('/absence', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager  = $this->getUser();
        $centre   = $manager->getCentre();
        $body     = json_decode($request->getContent(), true) ?? [];

        $userId = (int) ($body['userId'] ?? 0);
        $dateStr = $body['date'] ?? '';
        $type    = $body['type'] ?? 'AUTRE';
        $motif   = $body['motif'] ?? null;

        if (!$userId || !$dateStr) {
            return $this->json(['error' => 'userId et date sont requis'], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($type, Absence::TYPES, true)) {
            return $this->json(['error' => 'Type d\'absence invalide'], Response::HTTP_BAD_REQUEST);
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateStr);
        if (!$date) {
            return $this->json(['error' => 'Format de date invalide (YYYY-MM-DD attendu)'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->find($userId);
        if (!$user || $user->getCentre()->getId() !== $centre->getId()) {
            return $this->json(['error' => 'Employé introuvable ou hors centre'], Response::HTTP_NOT_FOUND);
        }

        $absence = new Absence();
        $absence->setCentre($centre);
        $absence->setUser($user);
        $absence->setDate($date);
        $absence->setType($type);
        $absence->setMotif($motif ?: null);
        $absence->setCreatedBy($manager);

        $this->em->persist($absence);
        $this->em->flush();

        return $this->json([
            'id'     => $absence->getId(),
            'userId' => $user->getId(),
            'date'   => $absence->getDate()->format('Y-m-d'),
            'type'   => $absence->getType(),
            'motif'  => $absence->getMotif(),
        ], Response::HTTP_CREATED);
    }

    /**
     * DELETE /api/planning/absence/{id}
     * Supprime une absence (vérification multi-tenant).
     */
    #[Route('/absence/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function delete(int $id): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $absence = $this->absenceRepository->find($id);

        if (!$absence || $absence->getCentre()->getId() !== $manager->getCentre()->getId()) {
            return $this->json(['error' => 'Absence introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($absence);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}

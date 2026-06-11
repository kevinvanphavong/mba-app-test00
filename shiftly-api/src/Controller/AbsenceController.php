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
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/planning', name: 'planning_absence_')]
class AbsenceController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly AbsenceRepository $absenceRepository,
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    /**
     * Valide une absence contre ses contraintes Symfony Validator.
     * Retourne une réponse 422 normalisée (champ → message) si invalide, sinon null.
     */
    private function validationErrors(Absence $absence): ?JsonResponse
    {
        $violations = $this->validator->validate($absence);
        if (0 === count($violations)) {
            return null;
        }

        $errors = [];
        foreach ($violations as $v) {
            $errors[$v->getPropertyPath()] = $v->getMessage();
        }

        return $this->json(['message' => 'Validation échouée', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * POST /api/planning/absence
     * Crée une absence pour un employé sur une date donnée.
     */
    #[Route('/absence', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $centre = $manager->getCentre();
        $body = json_decode($request->getContent(), true) ?? [];

        $userId = (int) ($body['userId'] ?? 0);
        $dateStr = $body['date'] ?? '';
        $type = $body['type'] ?? 'AUTRE';
        $motif = $body['motif'] ?? null;

        if (!$userId || !$dateStr) {
            return $this->json(['error' => 'userId et date sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Le type est validé par les contraintes de l'entité (→ 422 normalisé plus bas).

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

        if ($error = $this->validationErrors($absence)) {
            return $error;
        }

        $this->em->persist($absence);
        $this->em->flush();

        return $this->json([
            'id' => $absence->getId(),
            'userId' => $user->getId(),
            'date' => $absence->getDate()->format('Y-m-d'),
            'type' => $absence->getType(),
            'motif' => $absence->getMotif(),
        ], Response::HTTP_CREATED);
    }

    /**
     * PATCH /api/planning/absence/{id}
     * Modifie le type et/ou le motif d'une absence existante.
     */
    #[Route('/absence/{id}', name: 'update', methods: ['PATCH'])]
    #[IsGranted('ROLE_MANAGER')]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $absence = $this->absenceRepository->find($id);

        if (!$absence || $absence->getCentre()->getId() !== $manager->getCentre()->getId()) {
            return $this->json(['error' => 'Absence introuvable'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true) ?? [];

        if (isset($body['type'])) {
            // Validé par les contraintes de l'entité (→ 422 normalisé plus bas).
            $absence->setType($body['type']);
        }

        if (array_key_exists('motif', $body)) {
            $absence->setMotif($body['motif'] ?: null);
        }

        if ($error = $this->validationErrors($absence)) {
            return $error;
        }

        $this->em->flush();

        return $this->json([
            'id' => $absence->getId(),
            'date' => $absence->getDate()->format('Y-m-d'),
            'type' => $absence->getType(),
            'motif' => $absence->getMotif(),
        ]);
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

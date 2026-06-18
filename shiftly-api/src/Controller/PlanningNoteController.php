<?php

namespace App\Controller;

use App\Entity\PlanningNote;
use App\Repository\PlanningNoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Notes & événements du planning (P2). Multi-tenant : centre du JWT,
 * vérification d'appartenance inline (cf. AbsenceController).
 */
#[Route('/api/planning', name: 'planning_note_')]
class PlanningNoteController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanningNoteRepository $noteRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    private function validationErrors(PlanningNote $note): ?JsonResponse
    {
        $violations = $this->validator->validate($note);
        if (0 === count($violations)) {
            return null;
        }

        $errors = [];
        foreach ($violations as $v) {
            $errors[$v->getPropertyPath()] = $v->getMessage();
        }

        return $this->json(['message' => 'Validation échouée', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /** @return array<string, mixed> */
    private function serialize(PlanningNote $note): array
    {
        return [
            'id' => $note->getId(),
            'date' => $note->getDate()->format('Y-m-d'),
            'contenu' => $note->getContenu(),
            'auteur' => $note->getCreatedBy()?->getPrenom() ?? $note->getCreatedBy()?->getNom(),
        ];
    }

    #[Route('/note', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function create(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $centre = $manager->getCentre();
        $body = json_decode($request->getContent(), true) ?? [];

        $dateStr = $body['date'] ?? '';
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', (string) $dateStr);
        if (!$date) {
            return $this->json(['error' => 'Format de date invalide (YYYY-MM-DD attendu)'], Response::HTTP_BAD_REQUEST);
        }

        $note = new PlanningNote();
        $note->setCentre($centre);
        $note->setDate($date);
        $note->setContenu((string) ($body['contenu'] ?? ''));
        $note->setCreatedBy($manager);

        if ($error = $this->validationErrors($note)) {
            return $error;
        }

        $this->em->persist($note);
        $this->em->flush();

        return $this->json($this->serialize($note), Response::HTTP_CREATED);
    }

    #[Route('/note/{id}', name: 'update', methods: ['PATCH'])]
    #[IsGranted('ROLE_MANAGER')]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $note = $this->noteRepository->find($id);

        if (!$note || $note->getCentre()->getId() !== $manager->getCentre()->getId()) {
            return $this->json(['error' => 'Note introuvable'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true) ?? [];
        if (array_key_exists('contenu', $body)) {
            $note->setContenu((string) $body['contenu']);
        }

        if ($error = $this->validationErrors($note)) {
            return $error;
        }

        $this->em->flush();

        return $this->json($this->serialize($note));
    }

    #[Route('/note/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function delete(int $id): JsonResponse
    {
        /** @var \App\Entity\User $manager */
        $manager = $this->getUser();
        $note = $this->noteRepository->find($id);

        if (!$note || $note->getCentre()->getId() !== $manager->getCentre()->getId()) {
            return $this->json(['error' => 'Note introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($note);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}

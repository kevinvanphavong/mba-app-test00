<?php

namespace App\Controller;

use App\Entity\TutoRead;
use App\Entity\Tutoriel;
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
 * Endpoint custom pour marquer un tutoriel comme lu.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/tuto-reads/create
 * Body : { "tutorielId": 3 }
 * → { "id": 42, "tutorielId": 3, "readAt": "2026-03-27T10:00:00+00:00" }
 * → 409 si déjà marqué comme lu pour cet utilisateur
 */
#[IsGranted('ROLE_USER')]
class CreateTutoReadController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/tuto-reads/create', name: 'api_tuto_read_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $tutorielId = (int) ($body['tutorielId'] ?? 0);

        if (!$tutorielId) {
            throw new BadRequestHttpException('tutorielId est requis.');
        }

        $tutoriel = $this->em->find(Tutoriel::class, $tutorielId);

        if (!$tutoriel) {
            throw $this->createNotFoundException('Tutoriel introuvable.');
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->getUser();

        // Guard multi-tenant
        if ($tutoriel->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à ce tutoriel.');
        }

        $tutoRead = new TutoRead();
        $tutoRead->setUser($currentUser);
        $tutoRead->setTutoriel($tutoriel);

        try {
            $this->em->persist($tutoRead);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Ce tutoriel est déjà marqué comme lu.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json([
            'id'         => $tutoRead->getId(),
            'tutorielId' => $tutoriel->getId(),
            'readAt'     => $tutoRead->getReadAt()?->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }
}

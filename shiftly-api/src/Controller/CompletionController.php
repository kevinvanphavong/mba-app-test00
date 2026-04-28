<?php

namespace App\Controller;

use App\Entity\Completion;
use App\Entity\Mission;
use App\Entity\Poste;
use App\Entity\User;
use App\Service\FileUploadService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint custom pour cocher une mission.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 *   POST /api/completions/create              JSON  { "posteId": 28, "missionId": 137 }
 *   POST /api/completions/create-with-photo   multipart (champs posteId, missionId + fichier "photo")
 *   GET  /api/completions/{id}/photo          retourne le binaire (auth + multi-tenant guard)
 */
#[IsGranted('ROLE_USER')]
class CompletionController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly FileUploadService      $fileUploader,
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

        [$poste, $mission, $user] = $this->resolveAndGuard($posteId, $missionId);

        // Une mission requiresPhoto doit passer par l'endpoint multipart
        if ($mission->getRequiresPhoto()) {
            throw new BadRequestHttpException(
                'Cette mission nécessite une preuve photo. Utilise /completions/create-with-photo.'
            );
        }

        $completion = $this->persistCompletion($poste, $mission, $user);

        return $this->json([
            'id'          => $completion->getId(),
            'completedAt' => $completion->getCompletedAt()?->format(\DateTimeInterface::ATOM),
        ], 201);
    }

    /**
     * Création d'une completion avec preuve photo (multipart/form-data).
     * Champs attendus : posteId (int), missionId (int), photo (UploadedFile, image/jpeg|png|webp, max 5 MB).
     */
    #[Route('/api/completions/create-with-photo', name: 'api_completion_create_with_photo', methods: ['POST'])]
    public function createWithPhoto(Request $request): JsonResponse
    {
        $posteId   = (int) $request->request->get('posteId', 0);
        $missionId = (int) $request->request->get('missionId', 0);
        $photo     = $request->files->get('photo');

        if (!$posteId || !$missionId) {
            throw new BadRequestHttpException('posteId et missionId sont requis.');
        }
        if (!$photo) {
            throw new BadRequestHttpException('Le champ "photo" est requis.');
        }

        [$poste, $mission, $user] = $this->resolveAndGuard($posteId, $missionId);

        if (!$mission->getRequiresPhoto()) {
            throw new BadRequestHttpException(
                'Cette mission n\'attend pas de photo. Utilise /completions/create.'
            );
        }

        // Upload + validation MIME/taille (lance une exception si KO)
        try {
            $stored = $this->fileUploader->uploadCompletionPhoto($photo);
        } catch (\InvalidArgumentException $e) {
            throw new BadRequestHttpException($e->getMessage());
        }

        $completion = new Completion();
        $completion->setPoste($poste);
        $completion->setMission($mission);
        $completion->setUser($user);
        $completion->setPhotoPath($stored['storedPath']);
        $completion->setPhotoMimeType($stored['mime']);
        $completion->setPhotoTakenAt(new \DateTimeImmutable());

        try {
            $this->em->persist($completion);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Cette mission est déjà cochée pour ce poste.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json([
            'id'             => $completion->getId(),
            'completedAt'    => $completion->getCompletedAt()?->format(\DateTimeInterface::ATOM),
            'photoTakenAt'   => $completion->getPhotoTakenAt()?->format(\DateTimeInterface::ATOM),
            'hasPhoto'       => true,
        ], Response::HTTP_CREATED);
    }

    /**
     * Sert le binaire d'une photo de preuve.
     * Auth obligatoire + le centre de la completion doit matcher celui de l'utilisateur.
     */
    #[Route('/api/completions/{id}/photo', name: 'api_completion_photo', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function servePhoto(int $id): Response
    {
        $completion = $this->em->find(Completion::class, $id);
        if (!$completion || !$completion->getPhotoPath()) {
            throw $this->createNotFoundException('Photo introuvable.');
        }

        // Multi-tenant guard
        /** @var User $currentUser */
        $currentUser    = $this->getUser();
        $completionCtre = $completion->getPoste()?->getService()?->getCentre()?->getId();

        if ($completionCtre !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cette photo.');
        }

        $absolutePath = $this->fileUploader->getCompletionPhotoAbsolutePath($completion->getPhotoPath());
        if (!is_file($absolutePath)) {
            throw $this->createNotFoundException('Fichier photo introuvable sur disque.');
        }

        $response = new BinaryFileResponse($absolutePath);
        $response->headers->set('Content-Type', $completion->getPhotoMimeType() ?? 'image/jpeg');
        // Cache privé 1h — la photo est immuable mais l'auth doit être revérifiée régulièrement
        $response->headers->set('Cache-Control', 'private, max-age=3600');
        return $response;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Charge le poste, la mission, vérifie le multi-tenant.
     * @return array{0: Poste, 1: Mission, 2: User}
     */
    private function resolveAndGuard(int $posteId, int $missionId): array
    {
        $poste   = $this->em->find(Poste::class, $posteId);
        $mission = $this->em->find(Mission::class, $missionId);

        if (!$poste || !$mission) {
            throw $this->createNotFoundException('Poste ou Mission introuvable.');
        }

        /** @var User $currentUser */
        $currentUser   = $this->getUser();
        $posteCentreId = $poste->getService()?->getCentre()?->getId();

        if ($posteCentreId !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à ce poste.');
        }

        return [$poste, $mission, $currentUser];
    }

    private function persistCompletion(Poste $poste, Mission $mission, User $user): Completion
    {
        $completion = new Completion();
        $completion->setPoste($poste);
        $completion->setMission($mission);
        $completion->setUser($user);

        try {
            $this->em->persist($completion);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new BadRequestHttpException('Cette mission est déjà cochée pour ce poste.');
        }

        return $completion;
    }
}

<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Media;
use App\Entity\Mission;
use App\Entity\Tutoriel;
use App\Entity\User;
use App\Enum\MediaEntityType;
use App\Repository\MediaRepository;
use App\Security\Voter\MediaVoter;
use App\Service\MediaUploader;
use App\Service\R2StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoints du module Media.
 *
 *   POST /api/media                       multipart : file, entityType, entityId       (manager)
 *   GET  /api/media/{id}/url              renvoie une URL signée TTL 1h                 (voter VIEW)
 *   GET  /api/missions/{id}/medias        liste les médias d'une mission                (auth user)
 *   GET  /api/tutoriels/{id}/medias       liste les médias d'un tutoriel                (auth user)
 *
 * La suppression d'un Media passe par l'opération API Platform DELETE
 * /api/media/{id} (voter MEDIA_DELETE — manager only).
 */
#[IsGranted('ROLE_USER')]
class MediaController extends AbstractController
{
    public function __construct(
        private readonly MediaUploader $uploader,
        private readonly R2StorageService $r2,
        private readonly MediaRepository $mediaRepository,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/media', name: 'api_media_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function create(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        $entityType = (string) $request->request->get('entityType', '');
        $entityIdRaw = $request->request->get('entityId');

        if (!$file) {
            throw new BadRequestHttpException('Fichier requis (champ "file").');
        }

        $type = MediaEntityType::tryFrom($entityType);
        if (null === $type) {
            throw new BadRequestHttpException("entityType invalide : {$entityType}");
        }

        $entityId = is_numeric($entityIdRaw) ? (int) $entityIdRaw : 0;
        if ($entityId <= 0) {
            throw new BadRequestHttpException('entityId requis et numérique.');
        }

        // Voter UPLOAD : vérifie que le user appartient au centre de l'entité parente
        $this->denyAccessUnlessGranted(
            MediaVoter::UPLOAD,
            ['type' => $type, 'entityId' => $entityId],
            "Accès refusé sur l'entité parente {$entityType} #{$entityId}",
        );

        /** @var User $user */
        $user = $this->getUser();
        $centre = $this->resolveParentCentre($type, $entityId);

        if (null === $centre) {
            throw new NotFoundHttpException("Entité parente introuvable : {$entityType} #{$entityId}");
        }

        $media = $this->uploader->upload($file, $type, $entityId, $centre, $user);

        return $this->json($this->normalize($media), 201);
    }

    #[Route('/api/media/{id}/url', name: 'api_media_url', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function url(Media $media): JsonResponse
    {
        $this->denyAccessUnlessGranted(MediaVoter::VIEW, $media);

        $ttl = 3600;
        $expiresAt = (new \DateTimeImmutable())->modify("+{$ttl} seconds");

        return $this->json([
            'url' => $this->r2->presignedUrl($media->getStoragePath(), $ttl),
            'expiresAt' => $expiresAt->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/api/missions/{id}/medias', name: 'api_mission_medias', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function listForMission(Mission $mission): JsonResponse
    {
        $centreId = $mission->getZone()?->getCentre()?->getId();

        return $this->listForEntity(MediaEntityType::Mission, (int) $mission->getId(), $centreId);
    }

    #[Route('/api/tutoriels/{id}/medias', name: 'api_tutoriel_medias', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function listForTutoriel(Tutoriel $tutoriel): JsonResponse
    {
        $centreId = $tutoriel->getCentre()?->getId();

        return $this->listForEntity(MediaEntityType::Tutoriel, (int) $tutoriel->getId(), $centreId);
    }

    #[Route('/api/users/{id}/documents', name: 'api_user_documents', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function listForUser(User $employe): JsonResponse
    {
        $centreId = $employe->getCentre()?->getId();

        return $this->listForEntity(MediaEntityType::EmployeDocument, (int) $employe->getId(), $centreId);
    }

    private function listForEntity(MediaEntityType $type, int $entityId, ?int $parentCentreId): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $userCentreId = $user->getCentre()?->getId();

        if (null === $parentCentreId || null === $userCentreId || $parentCentreId !== $userCentreId) {
            // Multi-tenant guard : on ne révèle pas l'existence d'une entité d'un autre centre
            throw new NotFoundHttpException();
        }

        $medias = $this->mediaRepository->findByEntity($type, $entityId, $userCentreId);

        return $this->json(array_map(fn (Media $m) => $this->normalize($m), $medias));
    }

    private function resolveParentCentre(MediaEntityType $type, int $entityId): ?\App\Entity\Centre
    {
        return match ($type) {
            MediaEntityType::Mission => $this->em
                ->getRepository(Mission::class)
                ->find($entityId)
                ?->getZone()
                ?->getCentre(),
            MediaEntityType::Tutoriel => $this->em
                ->getRepository(Tutoriel::class)
                ->find($entityId)
                ?->getCentre(),
            MediaEntityType::EmployeDocument => $this->em
                ->getRepository(User::class)
                ->find($entityId)
                ?->getCentre(),
            MediaEntityType::Document => null,
        };
    }

    /** @return array<string, mixed> */
    private function normalize(Media $m): array
    {
        return [
            'id' => $m->getId(),
            'entityType' => $m->getEntityType()->value,
            'entityId' => $m->getEntityId(),
            'filename' => $m->getFilename(),
            'mimeType' => $m->getMimeType(),
            'sizeBytes' => $m->getSizeBytes(),
            'createdAt' => $m->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}

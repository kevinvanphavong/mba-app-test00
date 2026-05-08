<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\SupportAttachment;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

class FileUploadService
{
    private const MAX_SIZE        = 5 * 1024 * 1024; // 5 MB
    private const ALLOWED_MIMES   = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
    ];

    /** Photos de preuve (validation mission) : on accepte uniquement les images. */
    private const COMPLETION_PHOTO_MAX_SIZE      = 5 * 1024 * 1024; // 5 MB
    private const COMPLETION_PHOTO_ALLOWED_MIMES = [
        'image/jpeg', 'image/png', 'image/webp',
    ];

    public function __construct(
        private readonly R2StorageService $r2,
    ) {}

    /**
     * Upload un fichier sur R2 sous la clé `support/{centreId}/{YYYY}/{MM}/{uuid}.{ext}`
     * et retourne une entité SupportAttachment prête à persister.
     *
     * Le centre est passé explicitement car au moment de l'upload, le ticket
     * peut ne pas encore avoir d'id (création), et un super-admin sans centre
     * propre peut répondre à un ticket d'un autre centre — on prend toujours
     * celui du ticket parent.
     *
     * @throws \InvalidArgumentException si MIME ou taille invalide
     */
    public function uploadSupportAttachment(UploadedFile $file, User $uploadedBy, Centre $centre): SupportAttachment
    {
        if ($file->getSize() > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Fichier trop volumineux (max 5 MB)');
        }

        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Type de fichier non autorisé : {$mime}");
        }

        $now = new \DateTimeImmutable();
        $ext = $file->guessExtension() ?: 'bin';
        $key = sprintf(
            'support/%d/%s/%s/%s.%s',
            $centre->getId(),
            $now->format('Y'),
            $now->format('m'),
            Uuid::v4()->toRfc4122(),
            $ext,
        );

        $this->r2->upload($key, $file, $mime);

        return (new SupportAttachment())
            ->setFilename($file->getClientOriginalName() ?: basename($key))
            ->setStoredPath($key)
            ->setMimeType($mime)
            ->setSize($file->getSize() ?: 0)
            ->setUploadedBy($uploadedBy);
    }

    /**
     * Upload une photo de preuve pour une Completion (validation mission)
     * sur Cloudflare R2 sous la clé `completion/{YYYY}/{MM}/{uuid}.{ext}`.
     *
     * Retourne ['storedPath' => 'completion/...', 'mime' => '...'] —
     * `storedPath` est la clé R2, persistée sur Completion.photoPath.
     *
     * @throws \InvalidArgumentException si MIME ou taille invalide
     */
    public function uploadCompletionPhoto(UploadedFile $file): array
    {
        if ($file->getSize() > self::COMPLETION_PHOTO_MAX_SIZE) {
            throw new \InvalidArgumentException('Photo trop volumineuse (max 5 MB)');
        }

        $mime = $file->getMimeType();
        if (!in_array($mime, self::COMPLETION_PHOTO_ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Format de photo non autorisé : {$mime}");
        }

        $now = new \DateTimeImmutable();
        $ext = $file->guessExtension() ?: 'jpg';
        $key = sprintf(
            'completion/%s/%s/%s.%s',
            $now->format('Y'),
            $now->format('m'),
            Uuid::v4()->toRfc4122(),
            $ext,
        );

        $this->r2->upload($key, $file, $mime);

        return [
            'storedPath' => $key,
            'mime'       => $mime,
        ];
    }
}

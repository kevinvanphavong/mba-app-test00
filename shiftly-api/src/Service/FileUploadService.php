<?php

namespace App\Service;

use App\Entity\SupportAttachment;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
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
        private readonly string $projectDir,
        private readonly R2StorageService $r2,
    ) {}

    /**
     * Upload un fichier et retourne une entité SupportAttachment prête à persister.
     * Stocke dans public/uploads/support/{YYYY}/{MM}/{uuid}.{ext}
     *
     * @throws \InvalidArgumentException si MIME ou taille invalide
     */
    public function uploadSupportAttachment(UploadedFile $file, User $uploadedBy): SupportAttachment
    {
        if ($file->getSize() > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Fichier trop volumineux (max 5 MB)');
        }

        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Type de fichier non autorisé : {$mime}");
        }

        $now = new \DateTimeImmutable();
        $year  = $now->format('Y');
        $month = $now->format('m');

        $relativeDir = "uploads/support/{$year}/{$month}";
        $absoluteDir = $this->projectDir . '/public/' . $relativeDir;

        if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0775, true) && !is_dir($absoluteDir)) {
            throw new FileException("Impossible de créer le dossier d'upload");
        }

        $ext = $file->guessExtension() ?: 'bin';
        $storedName = bin2hex(random_bytes(12)) . '.' . $ext;

        try {
            $file->move($absoluteDir, $storedName);
        } catch (FileException $e) {
            throw new FileException('Erreur lors du stockage du fichier : ' . $e->getMessage());
        }

        return (new SupportAttachment())
            ->setFilename($file->getClientOriginalName() ?: $storedName)
            ->setStoredPath($relativeDir . '/' . $storedName)
            ->setMimeType($mime)
            ->setSize($file->getSize() ?: filesize($absoluteDir . '/' . $storedName) ?: 0)
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

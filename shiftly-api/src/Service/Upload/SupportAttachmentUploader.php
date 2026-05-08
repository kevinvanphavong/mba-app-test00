<?php

declare(strict_types=1);

namespace App\Service\Upload;

use App\Entity\Centre;
use App\Entity\SupportAttachment;
use App\Entity\User;
use App\Service\R2StorageService;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

/**
 * Upload d'une pièce jointe de ticket support sur Cloudflare R2.
 *
 * Whitelist : images (jpeg/png/gif/webp) + PDF, max 5 MB.
 * Clé R2 : `support/{centreId}/{YYYY}/{MM}/{uuid}.{ext}` (isolation tenant
 *          dans le bucket lui-même).
 *
 * Le centre est passé explicitement car au moment de l'upload, le ticket
 * peut ne pas encore avoir d'id (création), et un super-admin sans centre
 * propre peut répondre à un ticket d'un autre centre — on prend toujours
 * celui du ticket parent.
 */
class SupportAttachmentUploader
{
    private const MAX_SIZE      = 5 * 1024 * 1024;
    private const ALLOWED_MIMES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
    ];

    public function __construct(
        private readonly R2StorageService $r2,
    ) {}

    /**
     * @throws \InvalidArgumentException si MIME ou taille invalide
     */
    public function upload(UploadedFile $file, User $uploadedBy, Centre $centre): SupportAttachment
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
}

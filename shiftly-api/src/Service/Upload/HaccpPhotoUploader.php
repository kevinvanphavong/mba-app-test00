<?php

declare(strict_types=1);

namespace App\Service\Upload;

use App\Service\R2StorageService;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

/**
 * Upload d'une photo de preuve HACCP sur Cloudflare R2.
 * Pattern aligné sur CompletionPhotoUploader pour rester cohérent.
 *
 * Clé R2 : `haccp/{YYYY}/{MM}/{uuid}.{ext}`
 * Whitelist : images uniquement (jpeg / png / webp), max 5 MB.
 *
 * @return array{storedPath: string, mime: string}
 */
class HaccpPhotoUploader
{
    private const MAX_SIZE      = 5 * 1024 * 1024;
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public function __construct(private readonly R2StorageService $r2) {}

    public function upload(UploadedFile $file): array
    {
        if ($file->getSize() > self::MAX_SIZE) {
            throw new \InvalidArgumentException('Photo trop volumineuse (max 5 MB)');
        }
        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Format non autorisé : {$mime}");
        }

        $now = new \DateTimeImmutable();
        $ext = $file->guessExtension() ?: 'jpg';
        $key = sprintf('haccp/%s/%s/%s.%s', $now->format('Y'), $now->format('m'), Uuid::v4()->toRfc4122(), $ext);

        $this->r2->upload($key, $file, $mime);
        return ['storedPath' => $key, 'mime' => $mime];
    }
}

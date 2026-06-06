<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Media;
use App\Entity\User;
use App\Enum\MediaEntityType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Uid\Uuid;

/**
 * Orchestre l'upload d'un Media : valide le fichier, génère la clé R2,
 * délègue le binaire à R2StorageService, persiste la ligne en BDD.
 */
class MediaUploader
{
    /** Whitelist images : max 5 MB */
    private const IMAGE_MIMES    = ['image/jpeg', 'image/png', 'image/webp'];
    private const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

    /** PDF : max 20 MB */
    private const PDF_MIME     = 'application/pdf';
    private const PDF_MAX_SIZE = 20 * 1024 * 1024;

    public function __construct(
        private readonly R2StorageService       $r2,
        private readonly EntityManagerInterface $em,
    ) {}

    public function upload(
        UploadedFile    $file,
        MediaEntityType $type,
        int             $entityId,
        Centre          $centre,
        User            $uploader,
    ): Media {
        // Garde anti-500 : si PHP a rejeté l'upload (ex : upload_max_filesize dépassé),
        // le fichier temporaire n'existe pas et getMimeType() exploserait en 500.
        if (!$file->isValid()) {
            $message = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE
                        => 'Fichier trop volumineux pour le serveur (limite PHP dépassée).',
                UPLOAD_ERR_PARTIAL
                        => 'Upload interrompu, fichier incomplet. Réessayez.',
                default => 'Upload invalide : ' . $file->getErrorMessage(),
            };
            throw new BadRequestHttpException($message);
        }

        $mime = $file->getMimeType() ?? '';
        $size = (int) $file->getSize();

        $isImage = in_array($mime, self::IMAGE_MIMES, true);
        $isPdf   = $mime === self::PDF_MIME;

        if (!$isImage && !$isPdf) {
            throw new BadRequestHttpException("Type de fichier non autorisé : {$mime}");
        }

        $maxSize = $isImage ? self::IMAGE_MAX_SIZE : self::PDF_MAX_SIZE;
        if ($size > $maxSize) {
            $maxMb = (int) round($maxSize / 1024 / 1024);
            throw new BadRequestHttpException("Fichier trop volumineux (max {$maxMb} MB).");
        }

        $ext = $file->guessExtension() ?: ($isPdf ? 'pdf' : 'bin');
        $key = sprintf(
            '%d/media/%s/%s.%s',
            $centre->getId(),
            $type->value,
            Uuid::v4()->toRfc4122(),
            $ext,
        );

        // Upload R2 d'abord — si ça plante, pas de ligne BDD orpheline
        $this->r2->upload($key, $file, $mime);

        $media = (new Media())
            ->setCentre($centre)
            ->setEntityType($type)
            ->setEntityId($entityId)
            ->setFilename($file->getClientOriginalName() ?: basename($key))
            ->setMimeType($mime)
            ->setSizeBytes($size)
            ->setStoragePath($key)
            ->setUploadedBy($uploader);

        $this->em->persist($media);
        $this->em->flush();

        return $media;
    }
}

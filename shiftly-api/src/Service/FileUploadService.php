<?php

namespace App\Service;

use App\Entity\SupportAttachment;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileUploadService
{
    private const MAX_SIZE        = 5 * 1024 * 1024; // 5 MB
    private const ALLOWED_MIMES   = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
    ];

    public function __construct(private string $projectDir) {}

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
}

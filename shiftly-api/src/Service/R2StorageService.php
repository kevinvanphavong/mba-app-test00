<?php

declare(strict_types=1);

namespace App\Service;

use AsyncAws\S3\Input\GetObjectRequest;
use AsyncAws\S3\S3Client;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Wrapper générique S3 / Cloudflare R2.
 *
 * Aucune logique métier ici : les modules (Media, futur R2_MIGRATION pour les
 * photos Completion) génèrent eux-mêmes leur clé et appellent ce service.
 */
class R2StorageService
{
    private S3Client $client;

    public function __construct(
        string $accountId,
        string $accessKeyId,
        string $secretAccessKey,
        private readonly string $bucket,
        string $endpoint,
    ) {
        // Cloudflare R2 = S3-compatible. region:auto + pathStyleEndpoint:true obligatoire.
        $this->client = new S3Client([
            'endpoint'           => $endpoint !== '' ? $endpoint : "https://{$accountId}.r2.cloudflarestorage.com",
            'accessKeyId'        => $accessKeyId,
            'accessKeySecret'    => $secretAccessKey,
            'region'             => 'auto',
            'pathStyleEndpoint'  => true,
        ]);
    }

    /**
     * Upload un fichier ou un contenu binaire sur R2 sous la clé donnée.
     *
     * @param string                $key         Clé R2 (ex : "1/media/mission/uuid.jpg")
     * @param UploadedFile|string   $fileOrContent  UploadedFile reçu du form OU contenu binaire brut
     * @param string                $mime        Mime-type à enregistrer
     */
    public function upload(string $key, UploadedFile|string $fileOrContent, string $mime): void
    {
        $body = $fileOrContent instanceof UploadedFile
            ? file_get_contents($fileOrContent->getPathname())
            : $fileOrContent;

        if ($body === false) {
            throw new \RuntimeException("Lecture impossible du fichier source pour la clé {$key}");
        }

        $this->client->putObject([
            'Bucket'      => $this->bucket,
            'Key'         => $key,
            'Body'        => $body,
            'ContentType' => $mime,
        ])->resolve();
    }

    /**
     * Génère une URL signée GET valable $ttl secondes (1h par défaut).
     */
    public function presignedUrl(string $key, int $ttl = 3600): string
    {
        $request = new GetObjectRequest([
            'Bucket' => $this->bucket,
            'Key'    => $key,
        ]);

        return $this->client->presign($request, new \DateTimeImmutable("+{$ttl} seconds"));
    }

    /**
     * Supprime l'objet sur R2. Idempotent côté client : si l'objet n'existe
     * pas, R2 répond OK (pas d'exception).
     */
    public function delete(string $key): void
    {
        $this->client->deleteObject([
            'Bucket' => $this->bucket,
            'Key'    => $key,
        ])->resolve();
    }
}

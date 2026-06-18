<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Contrat;
use App\Entity\User;
use App\Enum\MediaEntityType;
use App\Repository\MediaRepository;

/**
 * Propose un historique de contrats pour un salarié à partir de ses documents
 * uploadés (contrats signés, avenants…), via l'IA. Ne persiste rien : renvoie
 * des propositions que le manager valide ensuite (sortie structurée).
 */
class ContratExtractionService
{
    /** Nombre max de documents envoyés à l'IA (borne le coût / la taille). */
    private const MAX_DOCS = 8;

    public function __construct(
        private readonly AiService $ai,
        private readonly MediaRepository $mediaRepository,
        private readonly R2StorageService $r2,
    ) {
    }

    public function isAvailable(): bool
    {
        return $this->ai->isConfigured();
    }

    /**
     * @return array{contrats: list<array<string, mixed>>}
     */
    public function suggest(User $employe): array
    {
        $medias = $this->mediaRepository->findAllByEntity(MediaEntityType::EmployeDocument, (int) $employe->getId());
        $medias = \array_slice($medias, 0, self::MAX_DOCS);

        $content = [];
        foreach ($medias as $media) {
            $object = $this->r2->getObject($media->getStoragePath());
            $mime = $media->getMimeType();
            $data = base64_encode($object['body']);

            if (str_starts_with($mime, 'image/')) {
                $content[] = ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $mime, 'data' => $data]];
            } elseif ('application/pdf' === $mime) {
                $content[] = ['type' => 'document', 'source' => ['type' => 'base64', 'media_type' => $mime, 'data' => $data]];
            }
        }

        if ([] === $content) {
            return ['contrats' => []];
        }

        $content[] = [
            'type' => 'text',
            'text' => "Voici les documents RH du salarié {$employe->getPrenom()} {$employe->getNom()}. "
                .'Extrais l\'historique de ses contrats de travail. Pour chaque contrat distinct trouvé, '
                .'renvoie le type, la date de début, la date de fin (null si en cours), la qualification/emploi '
                .'et les heures hebdomadaires. Si une information est absente, mets null. '
                .'N\'invente rien : ne renvoie que les contrats réellement présents dans les documents.',
        ];

        $system = 'Tu es un assistant RH français rigoureux. Tu extrais des données de contrats de travail '
            .'depuis des documents officiels. Dates au format AAAA-MM-JJ. Types autorisés : '
            .implode(', ', Contrat::TYPES).'.';

        $result = $this->ai->ask($system, $content, $this->schema(), 4000);

        $contrats = isset($result['contrats']) && is_array($result['contrats']) ? $result['contrats'] : [];

        return ['contrats' => array_values($contrats)];
    }

    /**
     * @return array<string, mixed>
     */
    private function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['contrats'],
            'properties' => [
                'contrats' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['typeContrat', 'dateDebut', 'dateFin', 'qualification', 'heuresHebdo'],
                        'properties' => [
                            'typeContrat' => ['type' => 'string', 'enum' => Contrat::TYPES],
                            'dateDebut' => ['type' => 'string'],
                            'dateFin' => ['type' => ['string', 'null']],
                            'qualification' => ['type' => ['string', 'null']],
                            'heuresHebdo' => ['type' => ['integer', 'null']],
                        ],
                    ],
                ],
            ],
        ];
    }
}

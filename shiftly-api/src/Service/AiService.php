<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Couche IA réutilisable (Mistral AI — hébergement UE, RGPD) — point d'entrée
 * unique pour toutes les actions assistées par IA de Shiftly (tri, extraction,
 * proposition). Premier usage : extraction de l'historique des contrats depuis
 * les documents uploadés. D'autres usages se branchent sur la même méthode `ask()`.
 *
 * Appel HTTP direct (API chat compatible OpenAI) — pas de SDK. La clé vit dans
 * .env.local (jamais committée) ; vide = IA désactivée.
 */
class AiService
{
    private const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

    public function __construct(
        private readonly HttpClientInterface $http,
        #[Autowire(env: 'MISTRAL_API_KEY')]
        private readonly string $apiKey,
        #[Autowire(env: 'MISTRAL_MODEL')]
        private readonly string $model,
    ) {
    }

    public function isConfigured(): bool
    {
        return '' !== trim($this->apiKey);
    }

    /**
     * Envoie une requête à Mistral et renvoie soit du JSON décodé (si un schéma
     * de sortie structurée est fourni), soit le texte brut.
     *
     * @param string|list<array<string, mixed>> $userContent texte simple ou parts (text / image_url / document_url)
     * @param array<string, mixed>|null         $schema      JSON Schema pour forcer une sortie structurée
     *
     * @return array<string, mixed>|string
     */
    public function ask(string $system, string|array $userContent, ?array $schema = null, int $maxTokens = 4000): array|string
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('IA indisponible : configure MISTRAL_API_KEY dans .env.local.');
        }

        $payload = [
            'model' => '' !== trim($this->model) ? $this->model : 'pixtral-large-latest',
            'max_tokens' => $maxTokens,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $userContent],
            ],
        ];

        if (null !== $schema) {
            $payload['response_format'] = [
                'type' => 'json_schema',
                'json_schema' => ['name' => 'reponse', 'strict' => true, 'schema' => $schema],
            ];
        }

        $response = $this->http->request('POST', self::ENDPOINT, [
            'auth_bearer' => $this->apiKey,
            'json' => $payload,
            'timeout' => 120,
        ]);

        $data = $response->toArray(false);
        $text = (string) ($data['choices'][0]['message']['content'] ?? '');

        if ('' === $text && isset($data['message'])) {
            throw new \RuntimeException('Mistral : '.(is_string($data['message']) ? $data['message'] : json_encode($data['message'])));
        }

        if (null === $schema) {
            return $text;
        }

        $decoded = json_decode($text, true);

        return is_array($decoded) ? $decoded : [];
    }
}

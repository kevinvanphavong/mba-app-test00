<?php

declare(strict_types=1);

namespace App\Service;

use Anthropic\Client;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Couche IA réutilisable (Claude / Anthropic) — point d'entrée unique pour
 * toutes les actions assistées par IA de Shiftly (tri, extraction, proposition).
 *
 * Premier usage : extraction de l'historique des contrats depuis les documents
 * uploadés. D'autres usages viendront se brancher sur la même méthode `ask()`.
 *
 * La clé API vit dans .env.local (jamais committée) ; vide = IA désactivée.
 */
class AiService
{
    /** Modèle par défaut — le plus capable (cf. guidance Anthropic). */
    public const MODEL = 'claude-opus-4-8';

    private ?Client $client = null;

    public function __construct(
        #[Autowire(env: 'ANTHROPIC_API_KEY')]
        private readonly string $apiKey,
    ) {
    }

    public function isConfigured(): bool
    {
        return '' !== trim($this->apiKey);
    }

    /**
     * Envoie une requête à Claude et renvoie soit du JSON décodé (si un schéma
     * de sortie structurée est fourni), soit le texte brut.
     *
     * @param list<array<string, mixed>> $userContent blocs de contenu (text / document / image)
     * @param array<string, mixed>|null  $schema      JSON Schema pour forcer une sortie structurée
     *
     * @return array<string, mixed>|string
     */
    public function ask(string $system, array $userContent, ?array $schema = null, int $maxTokens = 4000): array|string
    {
        $params = [
            'maxTokens' => $maxTokens,
            'model' => self::MODEL,
            'system' => $system,
            'messages' => [['role' => 'user', 'content' => $userContent]],
        ];
        if (null !== $schema) {
            $params['outputConfig'] = ['format' => ['type' => 'json_schema', 'schema' => $schema]];
        }

        $message = $this->client()->messages->create(...$params);

        // Avec sortie structurée, le 1er bloc texte contient le JSON valide.
        $text = '';
        foreach ($message->content as $block) {
            if ('text' === ($block->type ?? null)) {
                $text = (string) $block->text;
                break;
            }
        }

        if (null === $schema) {
            return $text;
        }

        $decoded = json_decode($text, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function client(): Client
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('IA indisponible : configure ANTHROPIC_API_KEY dans .env.local.');
        }

        return $this->client ??= new Client(apiKey: $this->apiKey);
    }
}

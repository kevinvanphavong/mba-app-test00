<?php

namespace App\Tests\Fake;

use App\Core\Ia\IaGeneratorInterface;

/**
 * Faux générateur IA pour les tests fonctionnels : aucun appel Mistral réseau.
 * Renvoie un devis structuré déterministe (2 lignes) exploitable par DevisGenerator.
 * Branché à la place du générateur réel en env test (services.yaml).
 */
final class FakeIaGenerator implements IaGeneratorInterface
{
    public function generate(string $prompt, array $contexte = []): string
    {
        return json_encode([
            'lignes' => [
                ['designation' => 'Privatisation salle', 'quantite' => 1, 'prixUnitaireCents' => 50000],
                ['designation' => 'Formule par personne', 'quantite' => 20, 'prixUnitaireCents' => 2500],
            ],
        ], JSON_THROW_ON_ERROR);
    }
}

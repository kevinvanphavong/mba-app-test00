<?php

namespace App\Service;

/**
 * Normalise les lignes d'un devis et calcule les montants CÔTÉ SERVEUR.
 *
 * Source unique de vérité du tarif : le montant de chaque ligne est TOUJOURS
 * recalculé (quantité × prix unitaire, en centimes) et le total est leur somme —
 * jamais un montant/total fourni par le client ou l'IA. Utilisé par la génération
 * IA ({@see DevisGenerator}) et par l'édition gérant (State Processor).
 */
final class DevisLignesNormalizer
{
    /** Garde-fou anti-abus : nombre maximum de lignes conservées. */
    private const MAX_LIGNES = 100;

    /**
     * @param array<mixed> $lignes lignes brutes (client ou IA)
     *
     * @return list<array{designation: string, quantite: int, prixUnitaireCents: int, montantCents: int}>
     */
    public function normaliser(array $lignes): array
    {
        $out = [];
        foreach ($lignes as $ligne) {
            if (!\is_array($ligne)) {
                continue;
            }
            $designation = trim((string) ($ligne['designation'] ?? ''));
            if ('' === $designation) {
                continue;
            }
            $quantite = max(1, (int) ($ligne['quantite'] ?? 1));
            $prixUnitaireCents = max(0, (int) ($ligne['prixUnitaireCents'] ?? 0));

            $out[] = [
                'designation' => mb_substr($designation, 0, 255),
                'quantite' => $quantite,
                'prixUnitaireCents' => $prixUnitaireCents,
                // Montant TOUJOURS recalculé : un montant fourni par le client est ignoré.
                'montantCents' => $quantite * $prixUnitaireCents,
            ];

            if (\count($out) >= self::MAX_LIGNES) {
                break;
            }
        }

        return $out;
    }

    /**
     * @param list<array{montantCents: int}> $lignesNormalisees
     */
    public function total(array $lignesNormalisees): int
    {
        return array_sum(array_column($lignesNormalisees, 'montantCents'));
    }
}

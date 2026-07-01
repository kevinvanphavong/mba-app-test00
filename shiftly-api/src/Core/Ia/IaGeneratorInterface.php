<?php

namespace App\Core\Ia;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;

/**
 * Porte d'entrée UNIQUE de toutes les générations IA de la plateforme (devis B2B,
 * CRM/relances, console agence…). Encapsule le client Mistral en ajoutant quota
 * par centre, coupe-circuit et journalisation — aucun chantier ne doit appeler
 * `AiService` directement.
 */
interface IaGeneratorInterface
{
    /**
     * Génère une réponse IA pour le centre courant, dans la limite de son quota.
     *
     * @param string               $prompt   demande utilisateur
     * @param array<string, mixed> $contexte options : 'systeme' (string), 'usage' (string),
     *                                       'schema' (array JSON Schema), 'maxTokens' (int)
     *
     * @throws IaQuotaDepasseException plafond mensuel du centre atteint (aucun appel émis)
     * @throws IaIndisponibleException pas de centre, IA non configurée, ou erreur/timeout Mistral
     */
    public function generate(string $prompt, array $contexte = []): string;
}

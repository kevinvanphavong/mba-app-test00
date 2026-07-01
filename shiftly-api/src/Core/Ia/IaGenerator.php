<?php

namespace App\Core\Ia;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Entity\IaUsage;
use App\Repository\IaQuotaRepository;
use App\Service\AiService;
use App\Service\CurrentCentreResolver;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Implémentation de la porte d'entrée IA (wrapper d'{@see AiService}).
 *
 * Chaîne : centre courant (sinon fail-closed) → réservation d'un appel sous le
 * plafond mensuel (coupe-circuit atomique) → appel Mistral encapsulé (erreurs
 * jamais nues) → journalisation de la conso aboutie. La logique vit ici, jamais
 * dans un contrôleur ou un listener (CLAUDE.md règle 7).
 */
final class IaGenerator implements IaGeneratorInterface
{
    public function __construct(
        private readonly AiService $aiService,
        private readonly CurrentCentreResolver $centreResolver,
        private readonly IaQuotaRepository $quotas,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
        private readonly int $plafondMensuel,
    ) {
    }

    public function generate(string $prompt, array $contexte = []): string
    {
        // Fail-closed : sans centre résolu, aucun appel IA n'est émis.
        $centre = $this->centreResolver->resolve();
        if (null === $centre) {
            throw new IaIndisponibleException('Aucun centre courant : IA indisponible dans ce contexte.');
        }
        if (!$this->aiService->isConfigured()) {
            throw new IaIndisponibleException('IA non configurée.');
        }

        $periode = (new \DateTimeImmutable())->format('Y-m');
        $usage = \is_string($contexte['usage'] ?? null) ? $contexte['usage'] : 'generic';

        // Coupe-circuit DUR (atomique, race-safe) : réserve un appel sous le plafond.
        // Refus PROPRE au-delà — et aucun appel Mistral n'est émis.
        if (!$this->quotas->reserve($centre, $periode, $this->plafondMensuel)) {
            throw new IaQuotaDepasseException(\sprintf('Plafond IA mensuel atteint (%d appels) pour ce centre.', $this->plafondMensuel));
        }

        try {
            $text = $this->appelMistral($prompt, $contexte);
        } catch (\Throwable $e) {
            // Échec/timeout Mistral : on libère la réservation (la conso ne doit
            // compter que si elle aboutit) et on n'expose jamais l'erreur brute.
            $this->quotas->release($centre, $periode);
            $this->logger->error('Appel IA échoué', ['centre' => $centre->getId(), 'usage' => $usage, 'error' => $e->getMessage()]);

            throw new IaIndisponibleException('Le service IA est momentanément indisponible.', $e);
        }

        // Journalisation de la conso aboutie (audit / facturation).
        $this->em->persist(new IaUsage($centre, $usage));
        $this->em->flush();

        return $text;
    }

    /**
     * @param array<string, mixed> $contexte
     */
    private function appelMistral(string $prompt, array $contexte): string
    {
        $systeme = \is_string($contexte['systeme'] ?? null)
            ? $contexte['systeme']
            : 'Tu es un assistant concis et factuel.';
        $schema = \is_array($contexte['schema'] ?? null) ? $contexte['schema'] : null;
        $maxTokens = \is_int($contexte['maxTokens'] ?? null) ? $contexte['maxTokens'] : 4000;

        $result = $this->aiService->ask($systeme, $prompt, $schema, $maxTokens);

        // `ask()` renvoie un tableau si un schéma est fourni : on sérialise en JSON.
        return \is_array($result) ? (json_encode($result, JSON_UNESCAPED_UNICODE) ?: '') : $result;
    }
}

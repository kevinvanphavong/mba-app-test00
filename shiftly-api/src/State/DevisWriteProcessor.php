<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Devis;
use App\Service\DevisLignesNormalizer;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * State Processor du Patch gérant sur {@see Devis} : avant persistance, RECALCULE
 * les lignes (montant = quantité × prix unitaire) et le total CÔTÉ SERVEUR.
 *
 * Le `totalCents` n'est pas dans le groupe d'écriture (jamais désérialisé du client) ;
 * ici on l'écrase avec la somme recalculée. Un total ou un montant de ligne falsifié
 * par le client est donc systématiquement ignoré. Aucun envoi automatique : seul le
 * `statut` (validé par un humain) change le cycle de vie du devis.
 *
 * @implements ProcessorInterface<Devis, Devis>
 */
final class DevisWriteProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Devis, Devis> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly DevisLignesNormalizer $normalizer,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // $data est un Devis (processor attaché à la seule opération Patch de Devis).
        $lignes = $this->normalizer->normaliser($data->getLignes());
        $data->setLignes($lignes);
        $data->setTotalCents($this->normalizer->total($lignes));

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}

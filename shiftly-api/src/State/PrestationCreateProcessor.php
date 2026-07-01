<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Prestation;
use App\Service\CurrentCentreResolver;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * State Processor du POST gérant de {@see Prestation} : rattache TOUJOURS la nouvelle
 * prestation au centre du gérant (résolu par le JWT), jamais à un centre fourni par le
 * client. Empêche la création cross-tenant (un manager ne crée que chez lui).
 *
 * @implements ProcessorInterface<Prestation, Prestation>
 */
final class PrestationCreateProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<Prestation, Prestation> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly CurrentCentreResolver $centreResolver,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Centre imposé côté serveur (JWT) : la prestation appartient au centre du manager.
        $data->setCentre($this->centreResolver->resolve());

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}

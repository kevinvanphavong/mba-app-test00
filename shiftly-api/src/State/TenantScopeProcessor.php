<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\CentreOwnedInterface;
use App\Service\CurrentCentreResolver;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * FORCE le tenant côté serveur à la création d'une entité {@see CentreOwnedInterface} :
 * `centre = CurrentCentreResolver` (centre du JWT), quoi que contienne le payload. Le
 * client ne peut donc JAMAIS désigner le centre d'une entité créée via l'API — la faille
 * de mass-assignment cross-tenant est fermée à la source.
 *
 * Ne s'applique qu'aux opérations d'écriture API Platform (Post) ; les fixtures/commandes
 * (persistance directe via l'EntityManager) ne passent pas par ce processor et fixent leur
 * centre en PHP. Le ROLE_SUPERADMIN (accès global) n'est jamais forcé.
 *
 * @implements ProcessorInterface<CentreOwnedInterface, CentreOwnedInterface>
 */
final class TenantScopeProcessor implements ProcessorInterface
{
    /**
     * @param ProcessorInterface<CentreOwnedInterface, CentreOwnedInterface> $persistProcessor
     */
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly CurrentCentreResolver $centreResolver,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // $data est une entité CentreOwnedInterface (processor attaché aux seuls Post de ces
        // entités). Le super-admin opère globalement : on ne force pas son centre.
        if (!$this->security->isGranted('ROLE_SUPERADMIN')) {
            $data->setCentre($this->centreResolver->resolve());
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}

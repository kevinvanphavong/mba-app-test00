<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\User;
use App\Repository\CentreRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Résout le « centre courant » de façon unifiée, source unique de vérité du tenant.
 *
 * Ordre de résolution :
 *   1. centre du JWT si un utilisateur est authentifié et porte un centre ;
 *   2. sinon centre résolu par le domaine (host) de la requête — contexte public ;
 *   3. sinon aucun (null) → le filtre BDD doit alors être *fail-closed*.
 *
 * Le résolveur ne traite PAS le ROLE_SUPERADMIN : celui-ci opère légitimement sans
 * centre unique (accès global) et est court-circuité en amont par
 * {@see \App\Doctrine\CentreQueryExtension}. Le domaine n'est jamais lu d'un
 * paramètre fourni par le client : uniquement du host réel de la requête.
 */
final class CurrentCentreResolver
{
    public function __construct(
        private readonly Security $security,
        private readonly RequestStack $requestStack,
        private readonly CentreRepository $centreRepository,
    ) {
    }

    /**
     * Centre courant, ou null si aucun ne peut être résolu (→ fail-closed côté filtre).
     */
    public function resolve(): ?Centre
    {
        $user = $this->security->getUser();
        if ($user instanceof User && null !== $user->getCentre()) {
            return $user->getCentre();
        }

        return $this->resolveByHost();
    }

    /**
     * Résolution publique : host de la requête → centre revendiquant ce domaine.
     */
    public function resolveByHost(): ?Centre
    {
        $host = $this->requestStack->getCurrentRequest()?->getHost();
        if (null === $host || '' === $host) {
            return null;
        }

        return $this->centreRepository->findOneByDomaine($host);
    }
}

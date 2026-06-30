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
     * Le host est normalisé avant lookup pour qu'une casse ou un préfixe « www. »
     * ne masque pas le centre.
     */
    public function resolveByHost(): ?Centre
    {
        $host = $this->requestStack->getCurrentRequest()?->getHost();
        if (null === $host || '' === $host) {
            return null;
        }

        $host = self::normalizeHost($host);
        if ('' === $host) {
            return null;
        }

        return $this->centreRepository->findOneByDomaine($host);
    }

    /**
     * Normalise un host avant résolution : minuscules, sans port ni préfixe « www. ».
     * Garantit qu'un même domaine résout toujours le même centre quelle que soit la
     * forme reçue (« WWW.Bowling-Tours.fr:443 » → « bowling-tours.fr »).
     */
    public static function normalizeHost(string $host): string
    {
        $host = strtolower(trim($host));

        // Retire un port éventuel (« exemple.fr:8080 » → « exemple.fr »).
        if (false !== ($pos = strpos($host, ':'))) {
            $host = substr($host, 0, $pos);
        }

        // Retire le préfixe « www. ».
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        return $host;
    }
}

<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Fail-closed cockpit : refuse l'authentification d'un gérant/employé dont le centre
 * est **suspendu** (`actif = false`). Branché sur les firewalls `login` et `api`
 * (cf. security.yaml) → coupe le login ET chaque requête JWT tant que le centre est
 * suspendu. La réactivation rétablit l'accès immédiatement.
 *
 * Le ROLE_SUPERADMIN opère globalement (firewalls `superadmin_*`, sans ce checker) et
 * n'est de toute façon jamais bloqué ici.
 */
final class CentreActifUserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        $this->assertCentreActif($user);
    }

    public function checkPostAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        $this->assertCentreActif($user);
    }

    private function assertCentreActif(UserInterface $user): void
    {
        if (!$user instanceof User || User::ROLE_SUPERADMIN === $user->getRole()) {
            return;
        }

        $centre = $user->getCentre();
        if (null !== $centre && !$centre->isActif()) {
            throw new CustomUserMessageAccountStatusException('Ce centre est suspendu.');
        }
    }
}

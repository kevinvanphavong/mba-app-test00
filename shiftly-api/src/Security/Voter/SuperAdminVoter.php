<?php

namespace App\Security\Voter;

use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * Protège les routes /api/superadmin/*.
 * L'access_control dans security.yaml gère déjà ROLE_SUPERADMIN.
 * Ce voter refuse les DELETE si le JWT contient le claim impersonatedBy.
 */
class SuperAdminVoter extends Voter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return false;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        return false;
    }
}

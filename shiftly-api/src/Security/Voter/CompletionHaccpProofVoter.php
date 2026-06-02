<?php

namespace App\Security\Voter;

use App\Entity\CompletionHaccpProof;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

/**
 * VIEW + CREATE : tout user du centre (saisie staff depuis /service).
 * EDIT / DELETE : MANAGER du centre (correction a posteriori).
 */
class CompletionHaccpProofVoter extends Voter
{
    public const VIEW   = 'VIEW';
    public const EDIT   = 'EDIT';
    public const CREATE = 'CREATE';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof CompletionHaccpProof;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        /** @var CompletionHaccpProof $subject */
        $user = $token->getUser();
        if (!$user instanceof User) return false;

        if ($subject->getCentre()?->getId() !== $user->getCentre()?->getId()) return false;

        return match ($attribute) {
            self::VIEW, self::CREATE => true,
            self::EDIT, self::DELETE => $user->getRole() === User::ROLE_MANAGER,
            default => false,
        };
    }
}

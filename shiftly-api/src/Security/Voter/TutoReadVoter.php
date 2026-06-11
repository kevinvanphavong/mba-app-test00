<?php

namespace App\Security\Voter;

use App\Entity\TutoRead;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Un user ne peut voir/créer/supprimer que SES propres lectures.
 * Les MANAGER peuvent tout voir dans leur centre.
 */
class TutoReadVoter extends Voter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, ['VIEW', 'CREATE', 'DELETE'], true)
            && $subject instanceof TutoRead;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        /** @var TutoRead $subject */
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $sameCentre = $subject->getUser()?->getCentre()?->getId() === $user->getCentre()?->getId();
        if (!$sameCentre) {
            return false;
        }

        if (User::ROLE_MANAGER === $user->getRole()) {
            return true;
        }

        return $subject->getUser()?->getId() === $user->getId();
    }
}

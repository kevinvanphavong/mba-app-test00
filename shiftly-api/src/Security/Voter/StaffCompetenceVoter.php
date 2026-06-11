<?php

namespace App\Security\Voter;

use App\Entity\StaffCompetence;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;

class StaffCompetenceVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof StaffCompetence;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var StaffCompetence $subject */
        return $subject->getUser()?->getCentre()?->getId();
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        if (in_array($attribute, [self::CREATE, self::DELETE], true)) {
            $user = $token->getUser();
            if (!$user instanceof User) {
                return false;
            }
            if (User::ROLE_MANAGER !== $user->getRole()) {
                return false;
            }
        }

        return parent::voteOnAttribute($attribute, $subject, $token, $vote);
    }
}

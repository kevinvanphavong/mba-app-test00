<?php

namespace App\Security\Voter;

use App\Entity\User;

class UserVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof User;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var User $subject */
        return $subject->getCentre()?->getId();
    }
}

<?php

namespace App\Security\Voter;

use App\Entity\Zone;

class ZoneVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Zone;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Zone $subject */
        return $subject->getCentre()?->getId();
    }
}

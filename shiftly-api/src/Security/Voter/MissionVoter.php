<?php

namespace App\Security\Voter;

use App\Entity\Mission;

class MissionVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Mission;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Mission $subject */
        return $subject->getZone()?->getCentre()?->getId();
    }
}

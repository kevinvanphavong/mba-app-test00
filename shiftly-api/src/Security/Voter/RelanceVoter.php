<?php

namespace App\Security\Voter;

use App\Entity\Relance;

class RelanceVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Relance;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Relance $subject */
        return $subject->getCentre()?->getId();
    }
}

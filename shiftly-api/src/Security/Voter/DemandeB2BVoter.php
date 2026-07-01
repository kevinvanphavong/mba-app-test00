<?php

namespace App\Security\Voter;

use App\Entity\DemandeB2B;

class DemandeB2BVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof DemandeB2B;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var DemandeB2B $subject */
        return $subject->getCentre()?->getId();
    }
}

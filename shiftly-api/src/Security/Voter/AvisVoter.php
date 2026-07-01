<?php

namespace App\Security\Voter;

use App\Entity\Avis;

class AvisVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Avis;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Avis $subject */
        return $subject->getCentre()?->getId();
    }
}

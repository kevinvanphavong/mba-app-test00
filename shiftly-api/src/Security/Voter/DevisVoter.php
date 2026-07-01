<?php

namespace App\Security\Voter;

use App\Entity\Devis;

class DevisVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Devis;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Devis $subject */
        return $subject->getCentre()?->getId();
    }
}

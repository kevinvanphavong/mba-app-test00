<?php

namespace App\Security\Voter;

use App\Entity\Poste;

class PosteVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Poste;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Poste $subject */
        return $subject->getService()?->getCentre()?->getId();
    }
}

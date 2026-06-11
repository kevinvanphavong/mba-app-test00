<?php

namespace App\Security\Voter;

use App\Entity\Incident;

class IncidentVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Incident;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Incident $subject */
        return $subject->getCentre()?->getId();
    }
}

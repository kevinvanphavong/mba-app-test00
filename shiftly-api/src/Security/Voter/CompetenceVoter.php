<?php

namespace App\Security\Voter;

use App\Entity\Competence;

class CompetenceVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Competence;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Competence $subject */
        return $subject->getZone()?->getCentre()?->getId();
    }
}

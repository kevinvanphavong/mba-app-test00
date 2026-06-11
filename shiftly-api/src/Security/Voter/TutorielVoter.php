<?php

namespace App\Security\Voter;

use App\Entity\Tutoriel;

class TutorielVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Tutoriel;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Tutoriel $subject */
        return $subject->getCentre()?->getId();
    }
}

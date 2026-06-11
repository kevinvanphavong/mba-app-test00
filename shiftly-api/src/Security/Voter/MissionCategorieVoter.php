<?php

namespace App\Security\Voter;

use App\Entity\MissionCategorie;

class MissionCategorieVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof MissionCategorie;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var MissionCategorie $subject */
        return $subject->getCentre()?->getId();
    }
}

<?php

namespace App\Security\Voter;

use App\Entity\Completion;

class CompletionVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Completion;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Completion $subject */
        return $subject->getPoste()?->getService()?->getCentre()?->getId();
    }
}

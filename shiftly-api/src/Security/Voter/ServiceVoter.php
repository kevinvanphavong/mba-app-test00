<?php

namespace App\Security\Voter;

use App\Entity\Service;

class ServiceVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Service;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Service $subject */
        return $subject->getCentre()?->getId();
    }
}

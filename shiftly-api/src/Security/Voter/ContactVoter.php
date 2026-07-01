<?php

namespace App\Security\Voter;

use App\Entity\Contact;

class ContactVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Contact;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Contact $subject */
        return $subject->getCentre()?->getId();
    }
}

<?php

namespace App\Security\Voter;

use App\Entity\Reservation;

class ReservationVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof Reservation;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /* @var Reservation $subject */
        return $subject->getCentre()?->getId();
    }
}

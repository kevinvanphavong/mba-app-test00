<?php

namespace App\Security\Voter;

use App\Entity\EventLog;

/**
 * Cloison stricte par centre — un manager ne voit QUE les events de son centre.
 * Lecture seule : aucun EDIT / CREATE / DELETE n'est exposé sur EventLog.
 */
class EventLogVoter extends AbstractCentreVoter
{
    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::VIEW && $subject instanceof EventLog;
    }

    protected function getCentreId(mixed $subject): ?int
    {
        /** @var EventLog $subject */
        return $subject->getCentre()?->getId();
    }
}

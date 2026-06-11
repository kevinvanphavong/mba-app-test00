<?php

namespace App\Event;

use App\Entity\Lead;
use Symfony\Contracts\EventDispatcher\Event;

/**
 * Dispatché après la persistence d'un nouveau Lead public.
 * Découple la création de la notification (email Gmail, futurs webhooks Slack…).
 */
class LeadCreatedEvent extends Event
{
    public function __construct(public readonly Lead $lead)
    {
    }
}

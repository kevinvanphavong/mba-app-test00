<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Lead;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter sur Lead — réservé strictement à ROLE_SUPERADMIN.
 * Pas multi-tenant : un lead n'appartient à aucun centre, seul Kévin le voit.
 */
class LeadVoter extends Voter
{
    public const VIEW = 'LEAD_VIEW';
    public const EDIT = 'LEAD_EDIT';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT], true)
            && (null === $subject || $subject instanceof Lead);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return in_array('ROLE_SUPERADMIN', $user->getRoles(), true);
    }
}

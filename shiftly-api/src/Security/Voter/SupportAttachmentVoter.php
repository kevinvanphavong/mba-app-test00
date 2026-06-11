<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\SupportAttachment;
use App\Entity\SupportTicket;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter sur SupportAttachment pour la lecture via URL signée R2.
 *
 * Autorise si :
 *   - super-admin (`ROLE_SUPERADMIN`) — accès global au support
 *   - auteur du ticket parent
 *   - manager du même centre que le ticket
 *
 * Le ticket parent est résolu soit directement (`attachment.ticket`), soit
 * via la reply (`attachment.reply.ticket`).
 */
class SupportAttachmentVoter extends Voter
{
    public const VIEW = 'SUPPORT_ATTACHMENT_VIEW';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::VIEW === $attribute && $subject instanceof SupportAttachment;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        // Super-admin a accès global au module support
        if (in_array('ROLE_SUPERADMIN', $user->getRoles(), true)) {
            return true;
        }

        /** @var SupportAttachment $subject */
        $ticket = $this->resolveParentTicket($subject);
        if (null === $ticket) {
            return false;
        }

        // Auteur du ticket parent
        if ($ticket->getAuteur()?->getId() === $user->getId()) {
            return true;
        }

        // Manager du centre du ticket
        $userCentreId = $user->getCentre()?->getId();
        $ticketCentreId = $ticket->getCentre()?->getId();
        if (
            null !== $userCentreId
            && $ticketCentreId === $userCentreId
            && in_array('ROLE_MANAGER', $user->getRoles(), true)
        ) {
            return true;
        }

        return false;
    }

    private function resolveParentTicket(SupportAttachment $attachment): ?SupportTicket
    {
        return $attachment->getTicket() ?? $attachment->getReply()?->getTicket();
    }
}

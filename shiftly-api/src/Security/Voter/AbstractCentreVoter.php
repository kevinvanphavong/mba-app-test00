<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Base voter : vérifie que l'utilisateur connecté appartient
 * au même centre que la ressource demandée.
 *
 * Attributes supportés : VIEW | EDIT | CREATE | DELETE
 */
abstract class AbstractCentreVoter extends Voter
{
    protected const VIEW = 'VIEW';
    protected const EDIT = 'EDIT';
    protected const CREATE = 'CREATE';
    protected const DELETE = 'DELETE';

    /** Retourne le centre_id de la ressource */
    abstract protected function getCentreId(mixed $subject): ?int;

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        $resourceCentreId = $this->getCentreId($subject);

        if (null === $resourceCentreId) {
            return false;
        }

        if ($user->getCentre()?->getId() !== $resourceCentreId) {
            return false;
        }

        return match ($attribute) {
            self::VIEW, self::EDIT, self::DELETE, self::CREATE => true,
            default => false,
        };
    }
}

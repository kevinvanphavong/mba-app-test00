<?php

namespace App\Security\Voter;

use App\Entity\MissionHaccpSpec;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class MissionHaccpSpecVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';
    public const CREATE = 'CREATE';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::CREATE, self::DELETE], true)
            && $subject instanceof MissionHaccpSpec;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        /** @var MissionHaccpSpec $subject */
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        if ($subject->getCentre()?->getId() !== $user->getCentre()?->getId()) {
            return false;
        }

        return match ($attribute) {
            self::VIEW => true,
            self::EDIT, self::CREATE, self::DELETE => User::ROLE_MANAGER === $user->getRole(),
            default => false,
        };
    }
}

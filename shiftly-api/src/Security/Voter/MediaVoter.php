<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Media;
use App\Entity\Mission;
use App\Entity\Tutoriel;
use App\Entity\User;
use App\Enum\MediaEntityType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter du module Media — multi-tenant.
 *
 * Trois attributs :
 *   - MEDIA_VIEW   : sujet = Media (depuis BDD)
 *   - MEDIA_DELETE : sujet = Media (depuis BDD)
 *   - MEDIA_UPLOAD : sujet = array{type: MediaEntityType, entityId: int}
 *                    car l'entité Media n'existe pas encore au moment de l'upload.
 *                    On vérifie alors que l'entité parente (Mission/Tutoriel)
 *                    appartient bien au centre du user.
 */
class MediaVoter extends Voter
{
    public const VIEW = 'MEDIA_VIEW';
    public const DELETE = 'MEDIA_DELETE';
    public const UPLOAD = 'MEDIA_UPLOAD';

    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (self::VIEW === $attribute || self::DELETE === $attribute) {
            return $subject instanceof Media;
        }
        if (self::UPLOAD === $attribute) {
            return is_array($subject)
                && isset($subject['type'], $subject['entityId'])
                && $subject['type'] instanceof MediaEntityType
                && is_int($subject['entityId']);
        }

        return false;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $userCentreId = $user->getCentre()?->getId();
        if (null === $userCentreId) {
            return false;
        }

        return match ($attribute) {
            self::VIEW, self::DELETE => $this->voteOnMedia($userCentreId, $subject),
            self::UPLOAD => $this->voteOnUpload($userCentreId, $subject),
            default => false,
        };
    }

    private function voteOnMedia(int $userCentreId, Media $media): bool
    {
        return $media->getCentre()?->getId() === $userCentreId;
    }

    /**
     * @param array{type: MediaEntityType, entityId: int} $subject
     */
    private function voteOnUpload(int $userCentreId, array $subject): bool
    {
        $type = $subject['type'];
        $entityId = $subject['entityId'];

        $parentCentreId = $this->resolveParentCentreId($type, $entityId);
        if (null === $parentCentreId) {
            return false;
        }

        return $parentCentreId === $userCentreId;
    }

    private function resolveParentCentreId(MediaEntityType $type, int $entityId): ?int
    {
        return match ($type) {
            MediaEntityType::Mission => $this->em
                ->getRepository(Mission::class)
                ->find($entityId)
                ?->getZone()
                ?->getCentre()
                ?->getId(),
            MediaEntityType::Tutoriel => $this->em
                ->getRepository(Tutoriel::class)
                ->find($entityId)
                ?->getCentre()
                ?->getId(),
            MediaEntityType::EmployeDocument => $this->em
                ->getRepository(User::class)
                ->find($entityId)
                ?->getCentre()
                ?->getId(),
            // Document générique : pas encore d'entité, refus par défaut
            MediaEntityType::Document => null,
        };
    }
}

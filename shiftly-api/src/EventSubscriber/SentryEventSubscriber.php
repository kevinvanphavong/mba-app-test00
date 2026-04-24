<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Configure le scope Sentry après chaque authentification JWT réussie
 * pour tagger les erreurs avec centre_id, user_id et role.
 */
class SentryEventSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            Events::JWT_AUTHENTICATED => 'onJwtAuthenticated',
        ];
    }

    public function onJwtAuthenticated(JWTAuthenticatedEvent $event): void
    {
        if (!class_exists(\Sentry\SentrySdk::class)) {
            return;
        }

        $user = $event->getToken()->getUser();
        if (!$user instanceof User) {
            return;
        }

        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($user): void {
            $scope->setUser([
                'id'    => $user->getId(),
                'email' => $user->getEmail(),
            ]);

            $scope->setTag('user_id',   (string) $user->getId());
            $scope->setTag('user_role', $user->getRole());

            if ($user->getCentre()) {
                $scope->setTag('centre_id',  (string) $user->getCentre()->getId());
                $scope->setTag('centre_nom', $user->getCentre()->getNom() ?? '');
            }
        });
    }
}

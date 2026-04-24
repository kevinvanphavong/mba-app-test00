<?php

namespace App\EventSubscriber;

use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Bloque les méthodes destructives (DELETE) quand la requête est faite
 * avec un JWT contenant le claim `impersonatedBy` (mode impersonation superadmin).
 *
 * Objectif : empêcher un superadmin impersonant un manager de supprimer
 * des données depuis l'app classique. Le blocage se fait avant l'exécution
 * du controller, via une 403 JSON.
 */
class ImpersonationGuardSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly Security                $security,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        // Seules les requêtes API et méthodes destructives sont filtrées
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }
        if ($request->getMethod() !== 'DELETE') {
            return;
        }

        $token = $this->security->getToken();
        if (!$token) {
            return;
        }

        // Décode le payload JWT pour chercher le claim impersonatedBy
        $credentials = $token->getAttribute('token') ?? null;
        if (!$credentials) {
            // Fallback : on lit le header Authorization
            $authHeader = $request->headers->get('Authorization', '');
            if (!str_starts_with($authHeader, 'Bearer ')) {
                return;
            }
            $jwt = substr($authHeader, 7);
        } else {
            $jwt = (string) $credentials;
        }

        try {
            $payload = $this->jwtManager->parse($jwt);
        } catch (\Throwable) {
            return;
        }

        if (empty($payload['impersonatedBy'])) {
            return;
        }

        $event->setResponse(new JsonResponse([
            'message' => 'Action refusée en mode impersonation — les suppressions sont interdites.',
        ], 403));
    }
}

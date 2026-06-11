<?php

namespace App\EventSubscriber;

use App\Security\PathAwareCookieTokenExtractor;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
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
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

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
        if ('DELETE' !== $request->getMethod()) {
            return;
        }

        // Le JWT de centre vit dans le cookie httpOnly `token`. On le lit
        // directement (ce listener tourne avant l'authentification du firewall,
        // donc security->getToken() n'est pas encore peuplé ici).
        $jwt = (string) $request->cookies->get(PathAwareCookieTokenExtractor::APP_COOKIE, '');
        if ('' === $jwt) {
            return;
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

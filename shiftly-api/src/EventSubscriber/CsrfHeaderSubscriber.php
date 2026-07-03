<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Protection CSRF "custom header" (défense en profondeur, en plus de SameSite=Lax).
 *
 * Toute mutation /api (POST/PUT/PATCH/DELETE) doit porter l'en-tête `X-CSRF`.
 * Un site tiers ne peut pas ajouter cet en-tête sur une requête cross-origin sans
 * passer le preflight CORS — or le CORS n'autorise que l'origine du front. Donc
 * une requête forgée depuis un autre site est rejetée (403) avant le controller.
 *
 * Endpoints publics exemptés : login (app + superadmin), capture de leads, et toute
 * la zone publique `^/api/public` (site client + réservation B2C) — appelés sans
 * session ni JWT établis (firewall `security: false`), donc sans autorité ambiante
 * qu'une requête forgée pourrait détourner : le CSRF n'a pas de prise.
 */
class CsrfHeaderSubscriber implements EventSubscriberInterface
{
    private const HEADER = 'X-CSRF';
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    /**
     * Chemins exacts exemptés (pas de session = pas de risque CSRF).
     */
    private const EXEMPT_PATHS = [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/superadmin/auth/login',
        '/api/leads',
    ];

    public static function getSubscribedEvents(): array
    {
        // Avant l'ImpersonationGuard (10) et l'authentification : on coupe tôt.
        return [KernelEvents::REQUEST => ['onKernelRequest', 20]];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api')) {
            return;
        }
        if (\in_array($request->getMethod(), self::SAFE_METHODS, true)) {
            return;
        }
        if (\in_array($path, self::EXEMPT_PATHS, true)) {
            return;
        }
        // Zone publique sans session/JWT (firewall security:false) : pas de risque CSRF.
        if (str_starts_with($path, '/api/public/')) {
            return;
        }
        // Ingestion machine-to-machine : authentifiée par clé secrète (header), pas par
        // cookie/JWT ambiant → le CSRF n'a aucune prise. La clé EST l'autorisation.
        if (str_starts_with($path, '/api/ingest')) {
            return;
        }

        if (!$request->headers->has(self::HEADER)) {
            $event->setResponse(new JsonResponse([
                'message' => 'Requête refusée : en-tête anti-CSRF manquant.',
            ], 403));
        }
    }
}

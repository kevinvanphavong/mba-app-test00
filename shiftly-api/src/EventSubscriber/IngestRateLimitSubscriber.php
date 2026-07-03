<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Anti-abus léger de la zone d'ingestion machine-to-machine (`^/api/ingest`).
 *
 * Clé = la clé d'ingestion (header) à défaut l'IP : chaque source (centre) est limitée
 * indépendamment, l'abus d'une clé ne pénalise pas les autres. S'exécute avant le
 * contrôleur ; un dépassement renvoie 429 sans traiter la requête.
 */
class IngestRateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly RateLimiterFactory $ingestLimiter)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['onKernelRequest', 15]];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/api/ingest')) {
            return;
        }

        $cle = $request->headers->get('X-Shiftly-Ingest-Key') ?: ('ip:'.$request->getClientIp());

        if (!$this->ingestLimiter->create($cle)->consume(1)->isAccepted()) {
            $event->setResponse(new JsonResponse([
                'message' => 'Trop de requêtes d\'ingestion. Réessaie dans un instant.',
            ], JsonResponse::HTTP_TOO_MANY_REQUESTS));
        }
    }
}

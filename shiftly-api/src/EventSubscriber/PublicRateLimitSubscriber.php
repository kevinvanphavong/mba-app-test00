<?php

namespace App\EventSubscriber;

use App\Service\CurrentCentreResolver;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Anti-abus des écritures de la zone publique (^/api/public/*).
 *
 * Ces endpoints sont ouverts (sans auth) et certains coûtent cher : une demande B2B
 * déclenche l'IA payante, une réservation planifie des jobs CRM. Sans limite, un
 * anonyme pourrait drainer le quota IA d'un centre victime ou flooder la base.
 *
 * Clé = IP cliente + centre (résolu par host) : l'abus d'un centre ne pénalise pas
 * les autres, et un même centre est protégé contre le flood d'une IP. Le webhook
 * Stripe est exclu (signé, contrôlé et rejoué légitimement par Stripe).
 */
class PublicRateLimitSubscriber implements EventSubscriberInterface
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
    private const WEBHOOK_PATH = '/api/public/stripe/webhook';

    public function __construct(
        private readonly RateLimiterFactory $publicWriteLimiter,
        private readonly CurrentCentreResolver $centreResolver,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        // Après le CsrfHeaderSubscriber (20) ; avant le contrôleur.
        return [KernelEvents::REQUEST => ['onKernelRequest', 15]];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api/public/') || self::WEBHOOK_PATH === $path) {
            return;
        }
        if (\in_array($request->getMethod(), self::SAFE_METHODS, true)) {
            return;
        }

        // Clé par IP + centre (le host résout le centre ; à défaut, on retombe sur le host).
        $centre = $this->centreResolver->resolveByHost();
        $cle = $request->getClientIp().'|'.(null !== $centre ? 'c:'.$centre->getId() : 'h:'.$request->getHost());

        if (!$this->publicWriteLimiter->create($cle)->consume(1)->isAccepted()) {
            $event->setResponse(new JsonResponse([
                'message' => 'Trop de requêtes. Réessaie dans un instant.',
            ], JsonResponse::HTTP_TOO_MANY_REQUESTS));
        }
    }
}

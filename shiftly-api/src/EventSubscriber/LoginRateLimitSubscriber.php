<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;

/**
 * Anti brute-force sur les logins (app + superadmin).
 *
 * On compte les ÉCHEC de connexion (LoginFailureEvent) par couple IP+email, et on
 * bloque la requête suivante en 429 dès que la limite est atteinte (5 / 15 min,
 * cf. rate_limiter.yaml `auth_login`). Une connexion réussie ne consomme rien.
 *
 * (Remplace `login_throttling` natif, qui ne déclenchait pas de façon fiable ici,
 * et l'ancien anti-flood maison.)
 */
class LoginRateLimitSubscriber implements EventSubscriberInterface
{
    private const LOGIN_PATHS = [
        '/api/auth/login',
        '/api/superadmin/auth/login',
    ];

    public function __construct(private readonly RateLimiterFactory $authLoginLimiter)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            // Avant l'authentification : on coupe tôt si déjà bloqué.
            KernelEvents::REQUEST => ['onKernelRequest', 30],
            LoginFailureEvent::class => 'onLoginFailure',
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!$this->isLoginAttempt($request)) {
            return;
        }

        // consume(0) ne décrémente pas : on lit juste les jetons restants.
        $limit = $this->authLoginLimiter->create($this->key($request))->consume(0);
        if ($limit->getRemainingTokens() < 1) {
            $event->setResponse(new JsonResponse([
                'message' => 'Trop de tentatives de connexion. Réessaie dans quelques minutes.',
            ], Response::HTTP_TOO_MANY_REQUESTS));
        }
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        $request = $event->getRequest();
        if (!$this->isLoginAttempt($request)) {
            return;
        }

        $this->authLoginLimiter->create($this->key($request))->consume(1);
    }

    private function isLoginAttempt(Request $request): bool
    {
        return 'POST' === $request->getMethod()
            && \in_array($request->getPathInfo(), self::LOGIN_PATHS, true);
    }

    private function key(Request $request): string
    {
        $email = '';
        $data = json_decode($request->getContent(), true);
        if (\is_array($data)) {
            $email = strtolower(trim((string) ($data['email'] ?? '')));
        }

        return ($request->getClientIp() ?? 'unknown').'|'.$email;
    }
}

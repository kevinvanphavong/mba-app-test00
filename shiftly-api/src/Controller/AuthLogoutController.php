<?php

namespace App\Controller;

use App\Security\AuthCookieFactory;
use App\Security\PathAwareCookieTokenExtractor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Déconnexion de l'app/centre : expire le cookie `token`.
 *
 * Public (pas d'auth requise pour se déconnecter) — sert aussi à arrêter une
 * impersonation (on efface le JWT de centre, le cookie superadmin `sa_token`
 * reste intact). JWT stateless : la déconnexion = suppression du cookie.
 */
class AuthLogoutController extends AbstractController
{
    public function __construct(private readonly AuthCookieFactory $cookieFactory)
    {
    }

    #[Route('/api/auth/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $response = new JsonResponse(['message' => 'Déconnecté']);
        $response->headers->setCookie(
            $this->cookieFactory->expire(PathAwareCookieTokenExtractor::APP_COOKIE, $request)
        );

        return $response;
    }
}

<?php

namespace App\Controller;

use App\Security\AuthCookieFactory;
use App\Security\PathAwareCookieTokenExtractor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminAuthController extends AbstractController
{
    public function __construct(private readonly AuthCookieFactory $cookieFactory)
    {
    }

    #[Route('/api/superadmin/auth/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getUserIdentifier(),
            'nom' => $user->getNom(),
            'role' => $user->getRole(),
        ]);
    }

    #[Route('/api/superadmin/auth/logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        // JWT stateless : la déconnexion = expiration du cookie superadmin.
        $response = $this->json(['message' => 'Déconnecté']);
        $response->headers->setCookie(
            $this->cookieFactory->expire(PathAwareCookieTokenExtractor::SUPERADMIN_COOKIE, $request)
        );

        return $response;
    }
}

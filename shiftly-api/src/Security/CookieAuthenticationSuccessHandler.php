<?php

namespace App\Security;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;

/**
 * Success handler des firewalls de login (app + superadmin).
 *
 * Au lieu de renvoyer le JWT dans le corps (lisible en JS → vol de session via
 * XSS), on le pose dans un cookie HttpOnly et on renvoie seulement les infos
 * user/centre nécessaires à l'hydratation du store front.
 */
final class CookieAuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly AuthCookieFactory $cookieFactory,
    ) {
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): Response
    {
        /** @var User $user */
        $user = $token->getUser();

        $isSuperadmin = str_starts_with($request->getPathInfo(), '/api/superadmin');
        $cookieName = PathAwareCookieTokenExtractor::cookieNameForPath($request->getPathInfo());

        $jwt = $this->jwtManager->create($user);

        $body = $isSuperadmin
            ? $this->superadminPayload($user)
            : $this->appPayload($user);

        $response = new JsonResponse($body);
        $response->headers->setCookie($this->cookieFactory->create($cookieName, $jwt, $request));

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    private function appPayload(User $user): array
    {
        $centre = $user->getCentre();

        return [
            'id' => $user->getId(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'avatarColor' => $user->getAvatarColor(),
            'points' => $user->getPoints(),
            'centre' => $centre ? [
                'id' => $centre->getId(),
                'nom' => $centre->getNom(),
                'adresse' => $centre->getAdresse(),
                'telephone' => $centre->getTelephone(),
                'siteWeb' => $centre->getSiteWeb(),
                'openingHours' => $centre->getOpeningHours(),
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function superadminPayload(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getUserIdentifier(),
            'nom' => $user->getNom(),
            'role' => $user->getRole(),
        ];
    }
}

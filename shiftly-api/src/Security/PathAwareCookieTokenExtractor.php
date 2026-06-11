<?php

namespace App\Security;

use Lexik\Bundle\JWTAuthenticationBundle\TokenExtractor\TokenExtractorInterface;
use Symfony\Component\HttpFoundation\Request;

/**
 * Extrait le JWT depuis un cookie httpOnly — jamais depuis un header (le JS ne
 * manipule plus le token : anti-XSS).
 *
 * Deux sessions indépendantes coexistent (cf. impersonation superadmin) :
 *   - `sa_token`  pour le panneau superadmin (^/api/superadmin)
 *   - `token`     pour l'app/centre (le reste de /api) — c'est aussi ce cookie
 *                 qui porte le JWT du centre impersonné.
 *
 * Décore la chaîne d'extracteurs lexik : si aucun cookie pertinent, on délègue
 * (chaîne vide → false), ce qui laisse repasser un 401 propre.
 */
final class PathAwareCookieTokenExtractor implements TokenExtractorInterface
{
    public const APP_COOKIE = 'token';
    public const SUPERADMIN_COOKIE = 'sa_token';

    public function __construct(private readonly TokenExtractorInterface $inner)
    {
    }

    public function extract(Request $request): string|false
    {
        $name = self::cookieNameForPath($request->getPathInfo());
        $value = $request->cookies->get($name);

        if (\is_string($value) && '' !== $value) {
            return $value;
        }

        return $this->inner->extract($request);
    }

    /**
     * Le cookie à lire/poser selon le chemin appelé.
     */
    public static function cookieNameForPath(string $path): string
    {
        return str_starts_with($path, '/api/superadmin')
            ? self::SUPERADMIN_COOKIE
            : self::APP_COOKIE;
    }
}

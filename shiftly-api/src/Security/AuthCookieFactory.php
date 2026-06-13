<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

/**
 * Fabrique centralisée des cookies d'authentification (JWT).
 *
 * Flags : HttpOnly (le JS ne lit jamais le token). Secure aligné sur le protocole
 * (false en http://localhost, true derrière https). SameSite :
 *   - HTTPS (prod) → None : le front (Vercel) et l'API (Railway) sont sur des
 *     domaines racine différents (cross-site) ; Lax bloquerait le cookie sur les
 *     XHR. None+Secure l'autorise. La protection CSRF repose alors sur l'en-tête
 *     custom X-CSRF (CsrfHeaderSubscriber) + le CORS restreint, pas sur SameSite.
 *   - HTTP (dev localhost, same-site) → Lax : None exigerait Secure, impossible en http.
 * TTL aligné sur le token_ttl lexik.
 */
final class AuthCookieFactory
{
    public function __construct(private readonly int $tokenTtl)
    {
    }

    public function create(string $name, string $jwt, Request $request): Cookie
    {
        return Cookie::create($name)
            ->withValue($jwt)
            ->withExpires(time() + $this->tokenTtl)
            ->withPath('/')
            ->withSecure($request->isSecure())
            ->withHttpOnly(true)
            ->withSameSite($this->sameSite($request));
    }

    /**
     * Cookie d'expiration (déconnexion) — même nom/chemin, valeur vide, passé.
     */
    public function expire(string $name, Request $request): Cookie
    {
        return Cookie::create($name)
            ->withValue('')
            ->withExpires(1)
            ->withPath('/')
            ->withSecure($request->isSecure())
            ->withHttpOnly(true)
            ->withSameSite($this->sameSite($request));
    }

    /**
     * None en HTTPS (cross-site front↔API), Lax sinon (dev http localhost).
     */
    private function sameSite(Request $request): string
    {
        return $request->isSecure() ? Cookie::SAMESITE_NONE : Cookie::SAMESITE_LAX;
    }
}

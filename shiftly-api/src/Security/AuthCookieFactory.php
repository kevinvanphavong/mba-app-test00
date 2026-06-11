<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

/**
 * Fabrique centralisée des cookies d'authentification (JWT).
 *
 * Flags : HttpOnly (le JS ne lit jamais le token), SameSite=Lax (anti-CSRF de
 * base), Secure aligné sur le protocole de la requête (false en http://localhost,
 * true derrière https). TTL aligné sur le token_ttl lexik.
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
            ->withSameSite(Cookie::SAMESITE_LAX);
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
            ->withSameSite(Cookie::SAMESITE_LAX);
    }
}

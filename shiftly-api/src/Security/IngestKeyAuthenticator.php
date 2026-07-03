<?php

namespace App\Security;

use App\Repository\CentreRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

/**
 * Authentifie une requête d'ingestion machine-to-machine (`^/api/ingest`) par la clé
 * API de centre du header `X-Shiftly-Ingest-Key`. La clé identifie LE centre : on le
 * résout par `ingestKey` et on attache un {@see IngestUser} (ROLE_INGEST).
 *
 * Clé absente ou inconnue → 401. Aucune résolution par host ni par payload : le centre
 * vient UNIQUEMENT de la clé.
 */
final class IngestKeyAuthenticator extends AbstractAuthenticator
{
    private const HEADER = 'X-Shiftly-Ingest-Key';

    public function __construct(private readonly CentreRepository $centres)
    {
    }

    public function supports(Request $request): bool
    {
        return str_starts_with($request->getPathInfo(), '/api/ingest');
    }

    public function authenticate(Request $request): Passport
    {
        $key = (string) $request->headers->get(self::HEADER, '');
        if ('' === $key) {
            throw new CustomUserMessageAuthenticationException('Clé d\'ingestion manquante.');
        }

        $centre = $this->centres->findOneBy(['ingestKey' => $key]);
        if (null === $centre) {
            throw new CustomUserMessageAuthenticationException('Clé d\'ingestion inconnue.');
        }

        return new SelfValidatingPassport(new UserBadge($key, static fn (): IngestUser => new IngestUser($centre)));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null; // laisse passer vers le contrôleur
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        return new JsonResponse(['message' => 'Authentification d\'ingestion refusée.'], Response::HTTP_UNAUTHORIZED);
    }
}

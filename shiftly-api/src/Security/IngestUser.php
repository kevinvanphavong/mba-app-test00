<?php

namespace App\Security;

use App\Entity\Centre;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Identité machine d'une source d'ingestion authentifiée par clé API de centre.
 * Porte le {@see Centre} résolu depuis la clé et le rôle ROLE_INGEST. Le contrôleur
 * d'ingestion lit le centre ICI — jamais depuis le payload (isolation).
 */
final class IngestUser implements UserInterface
{
    public function __construct(private readonly Centre $centre)
    {
    }

    public function getCentre(): Centre
    {
        return $this->centre;
    }

    public function getRoles(): array
    {
        return ['ROLE_INGEST'];
    }

    public function getUserIdentifier(): string
    {
        return 'ingest-centre-'.$this->centre->getId();
    }

    public function eraseCredentials(): void
    {
    }
}

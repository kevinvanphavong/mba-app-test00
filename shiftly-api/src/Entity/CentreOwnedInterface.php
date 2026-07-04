<?php

namespace App\Entity;

/**
 * Entité rattachée à UN centre (tenant). Le tenant est FORCÉ côté serveur à la création
 * ({@see \App\State\TenantScopeProcessor}) : le client ne peut jamais désigner le centre
 * d'une entité (anti mass-assignment cross-tenant). En lecture, l'isolation reste assurée
 * par {@see \App\Doctrine\CentreQueryExtension}.
 */
interface CentreOwnedInterface
{
    public function getCentre(): ?Centre;

    public function setCentre(?Centre $centre): static;
}

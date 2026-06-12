<?php

namespace App\Controller\Concern;

use App\Entity\User;

/**
 * Garde d'appartenance au centre pour les controllers custom prenant un
 * {id}/{centreId} de centre en paramètre.
 *
 * Défense en profondeur multi-tenant (CLAUDE.md règle 9) : là où API Platform +
 * CentreQueryExtension ne s'appliquent pas (routes custom), on vérifie
 * explicitement que le centre ciblé est celui du user courant — sauf SUPERADMIN.
 *
 * À utiliser dans un AbstractController (getUser / isGranted / createAccessDeniedException).
 */
trait CentreGuardTrait
{
    /**
     * Refuse (403) si le centre ciblé n'est pas celui du user courant.
     * Le SUPERADMIN (ou un superadmin impersonant) n'est pas restreint.
     */
    private function denyUnlessOwnCentre(?int $centreId): void
    {
        if ($this->isGranted('ROLE_SUPERADMIN')) {
            return;
        }

        $user = $this->getUser();
        if (!$user instanceof User || null === $centreId || $user->getCentre()?->getId() !== $centreId) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }
    }
}

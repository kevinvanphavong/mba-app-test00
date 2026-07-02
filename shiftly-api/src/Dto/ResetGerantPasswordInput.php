<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Nouveau mot de passe du gérant (reset super-admin). Fixé par le super-admin, hashé
 * côté service, jamais loggé ni renvoyé en clair.
 */
final class ResetGerantPasswordInput
{
    #[Assert\NotBlank(message: 'Le mot de passe est requis.')]
    #[Assert\Length(min: 8, max: 255, minMessage: 'Mot de passe trop court (8 caractères minimum).')]
    public ?string $motDePasse = null;
}

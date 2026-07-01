<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Données d'entrée d'un avis public (POST /api/public/avis). Validation back.
 * Le centre est résolu par host ; l'email (optionnel) sert à rattacher l'avis au
 * contact existant du centre, jamais à créer d'accès.
 */
final class CreateAvisInput
{
    #[Assert\NotNull(message: 'La note est requise.')]
    #[Assert\Range(min: 1, max: 5, notInRangeMessage: 'La note doit être entre 1 et 5.')]
    public ?int $note = null;

    #[Assert\Length(max: 2000)]
    public ?string $commentaire = null;

    #[Assert\Email(message: 'Email invalide.')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;
}

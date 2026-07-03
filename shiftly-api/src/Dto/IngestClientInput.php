<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Coordonnées client d'une réservation ingérée (→ champs invité de la Reservation). */
final class IngestClientInput
{
    #[Assert\NotBlank(message: 'Le nom du client est requis.')]
    #[Assert\Length(max: 120)]
    public ?string $nom = null;

    #[Assert\NotBlank(message: 'L\'email du client est requis.')]
    #[Assert\Email(message: 'Email client invalide.')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;

    #[Assert\Length(max: 30)]
    public ?string $telephone = null;
}

<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/** Nouveau domaine d'un centre (PATCH super-admin). Normalisé + unicité côté service. */
final class UpdateDomaineInput
{
    #[Assert\NotBlank(message: 'Le domaine est requis.')]
    #[Assert\Length(max: 255)]
    public ?string $domaine = null;
}

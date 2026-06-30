<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Données d'entrée d'une réservation B2C invité (POST /api/public/reservations).
 *
 * Validation back **systématique** (Symfony Validator), jamais de confiance au
 * client (CLAUDE.md sécurité). Le centre n'est PAS dans ce payload : il est résolu
 * par le host côté contrôleur, jamais fourni par le visiteur. La prestation est
 * désignée par son id puis revérifiée comme appartenant au centre résolu.
 */
final class CreateReservationInput
{
    #[Assert\NotNull(message: 'La prestation est requise.')]
    #[Assert\Positive(message: 'Prestation invalide.')]
    public ?int $prestationId = null;

    /** Créneau réservé. Denormalisé depuis une chaîne ISO 8601 ; doit être futur. */
    #[Assert\NotNull(message: 'Le créneau est requis.')]
    #[Assert\GreaterThan(value: 'now', message: 'Le créneau doit être dans le futur.')]
    public ?\DateTimeImmutable $dateCreneau = null;

    #[Assert\NotNull(message: 'Le nombre de personnes est requis.')]
    #[Assert\Positive(message: 'Le nombre de personnes doit être supérieur à 0.')]
    #[Assert\LessThanOrEqual(value: 500, message: 'Nombre de personnes déraisonnable.')]
    public ?int $nbPersonnes = null;

    #[Assert\NotBlank(message: 'Le nom est requis.')]
    #[Assert\Length(max: 120)]
    public ?string $nom = null;

    #[Assert\NotBlank(message: 'L\'email est requis.')]
    #[Assert\Email(message: 'Email invalide.')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;

    #[Assert\NotBlank(message: 'Le téléphone est requis.')]
    #[Assert\Length(max: 30)]
    public ?string $telephone = null;
}

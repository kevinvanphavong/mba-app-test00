<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Données d'onboarding d'un nouveau client par le super-admin
 * (POST /api/superadmin/console/centres).
 *
 * Validation back systématique (Symfony Validator). Le mot de passe initial est
 * fixé ici par le super-admin puis hashé côté service — jamais stocké ni loggé en clair.
 */
final class CreateClientInput
{
    #[Assert\NotBlank(message: 'Le nom du centre est requis.')]
    #[Assert\Length(max: 100)]
    public ?string $nom = null;

    /** Domaine du site public du client (unique). Normalisé côté service. */
    #[Assert\NotBlank(message: 'Le domaine est requis.')]
    #[Assert\Length(max: 255)]
    public ?string $domaine = null;

    #[Assert\NotBlank(message: 'Le nom du gérant est requis.')]
    #[Assert\Length(max: 100)]
    public ?string $managerNom = null;

    #[Assert\NotBlank(message: 'L\'email du gérant est requis.')]
    #[Assert\Email(message: 'Email du gérant invalide.')]
    #[Assert\Length(max: 180)]
    public ?string $managerEmail = null;

    /** Mot de passe initial du gérant (communiqué hors-bande, jamais loggé). */
    #[Assert\NotBlank(message: 'Le mot de passe initial est requis.')]
    #[Assert\Length(min: 8, max: 255, minMessage: 'Mot de passe trop court (8 caractères minimum).')]
    public ?string $managerMotDePasse = null;

    #[Assert\NotNull(message: 'L\'abonnement est requis.')]
    #[Assert\PositiveOrZero(message: 'L\'abonnement ne peut pas être négatif.')]
    public ?int $abonnementMensuelCents = null;
}

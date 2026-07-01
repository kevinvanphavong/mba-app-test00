<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Données d'entrée d'une demande B2B publique (POST /api/public/demandes).
 * Validation back systématique (Symfony Validator) — jamais de confiance au client.
 * Le centre n'est PAS dans le payload : il est résolu par le host côté contrôleur.
 */
final class CreateDemandeB2BInput
{
    #[Assert\NotBlank(message: 'Le nom est requis.')]
    #[Assert\Length(max: 120)]
    public ?string $nomContact = null;

    #[Assert\NotBlank(message: 'L\'email est requis.')]
    #[Assert\Email(message: 'Email invalide.')]
    #[Assert\Length(max: 180)]
    public ?string $email = null;

    #[Assert\NotBlank(message: 'Le téléphone est requis.')]
    #[Assert\Length(max: 30)]
    public ?string $telephone = null;

    #[Assert\Length(max: 180)]
    public ?string $societe = null;

    #[Assert\NotBlank(message: 'Le type d\'événement est requis.')]
    #[Assert\Length(max: 120)]
    public ?string $typeEvenement = null;

    #[Assert\Positive(message: 'Le nombre de personnes doit être supérieur à 0.')]
    #[Assert\LessThanOrEqual(value: 100000)]
    public ?int $nbPersonnes = null;

    /** Date souhaitée au format ISO (AAAA-MM-JJ), optionnelle. */
    public ?\DateTimeImmutable $dateSouhaitee = null;

    #[Assert\NotBlank(message: 'Le message est requis.')]
    #[Assert\Length(max: 5000)]
    public ?string $message = null;
}

<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Payload d'ingestion d'une réservation externe (POST /api/ingest/reservations).
 * Validation back systématique. Le centre n'est PAS dans ce payload : il vient de la
 * clé API (header). `sourceRef` est la clé d'idempotence.
 */
final class IngestReservationInput
{
    #[Assert\NotBlank(message: 'sourceRef est requis (idempotence).')]
    #[Assert\Length(max: 120)]
    public ?string $sourceRef = null;

    #[Assert\Length(max: 40)]
    public ?string $source = 'fgc-web';

    #[Assert\Length(max: 120)]
    public ?string $type = null;

    #[Assert\NotNull(message: 'Le créneau est requis.')]
    public ?\DateTimeImmutable $dateCreneau = null;

    #[Assert\NotNull(message: 'Le nombre de personnes est requis.')]
    #[Assert\Positive(message: 'Le nombre de personnes doit être ≥ 1.')]
    public ?int $nbPersonnes = null;

    #[Assert\NotNull(message: 'Les coordonnées client sont requises.')]
    #[Assert\Valid]
    public ?IngestClientInput $client = null;

    #[Assert\Length(max: 120)]
    public ?string $formule = null;

    #[Assert\NotNull(message: 'Le montant total est requis.')]
    #[Assert\PositiveOrZero(message: 'Le montant ne peut pas être négatif.')]
    public ?int $montantTotalCents = null;

    #[Assert\Length(max: 30)]
    public ?string $statut = null;
}

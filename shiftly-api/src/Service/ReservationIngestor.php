<?php

namespace App\Service;

use App\Dto\IngestReservationInput;
use App\Entity\Centre;
use App\Entity\Reservation;
use App\Repository\ReservationRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Ingestion d'une réservation externe (site FGC → Shiftly). Logique métier hors
 * contrôleur (règle 7). Mappe le payload vers une {@see Reservation} :
 *  - le centre vient TOUJOURS de la clé API (paramètre `$centre`), jamais du payload ;
 *  - `client.*` → champs invité ; `formule` → libellé libre (pas de prestation en v1) ;
 *  - `statut` mappé sur l'enum Shiftly.
 *
 * **Idempotent** : unicité `(centre, source, sourceRef)`. Un `sourceRef` déjà ingéré
 * renvoie la réservation existante sans doublon (le rejeu est sans effet).
 *
 * @phpstan-type IngestResult array{reservation: Reservation, created: bool}
 */
final class ReservationIngestor
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * @return array{reservation: Reservation, created: bool}
     */
    public function ingest(Centre $centre, IngestReservationInput $input): array
    {
        $source = ($input->source ?? '') !== '' ? (string) $input->source : 'fgc-web';
        $sourceRef = (string) $input->sourceRef;

        $statut = $this->mapStatut($input->statut);

        // Upsert : même (centre, source, sourceRef) → on met à jour le statut (et les champs
        // modifiables), on renvoie 200. Le centre n'est JAMAIS touché. Aucun doublon (index unique).
        $existing = $this->reservations->findOneBy(['centre' => $centre, 'source' => $source, 'sourceRef' => $sourceRef]);
        if (null !== $existing) {
            $existing
                ->setStatut($statut)
                ->setNbPersonnes((int) $input->nbPersonnes)
                ->setMontantTotalCents((int) $input->montantTotalCents);
            $this->em->flush();

            return ['reservation' => $existing, 'created' => false];
        }

        // Le client est garanti non-null par la validation (Assert\NotNull) en amont.
        $client = $input->client ?? throw new \LogicException('Client requis (validé en amont).');

        $reservation = (new Reservation())
            ->setCentre($centre) // TOUJOURS le centre de la clé
            ->setSource($source)
            ->setSourceRef($sourceRef)
            ->setFormule($input->formule)
            ->setDateCreneau($input->dateCreneau)
            ->setNbPersonnes((int) $input->nbPersonnes)
            ->setNomInvite((string) $client->nom)
            ->setEmailInvite((string) $client->email)
            ->setTelephoneInvite($client->telephone ?? '')
            ->setMontantTotalCents((int) $input->montantTotalCents)
            ->setAcompteCents(0) // acompte géré côté source ; Shiftly stocke la copie de gestion
            ->setStatut($statut);

        $this->em->persist($reservation);
        $this->em->flush();

        return ['reservation' => $reservation, 'created' => true];
    }

    /**
     * Mappe le statut BRUT envoyé par la source (FGC) vers le vocabulaire Shiftly.
     * Shiftly est maître du vocabulaire (cf. docs/PONT_FGC_SHIFTLY.md). Statut inconnu
     * ou absent → EN_ATTENTE_ACOMPTE par défaut (jamais d'erreur).
     */
    private function mapStatut(?string $statut): string
    {
        return match (strtolower(trim((string) $statut))) {
            'confirme', 'confirmé', 'confirmed', 'paid', 'payé' => Reservation::STATUT_CONFIRMEE,
            'refuse', 'refusé', 'refused', 'annule', 'annulé', 'cancelled' => Reservation::STATUT_ANNULEE,
            'passe', 'passé', 'termine', 'terminé', 'done' => Reservation::STATUT_TERMINEE,
            default => Reservation::STATUT_EN_ATTENTE_ACOMPTE, // nouveau, contacte, inconnu, absent
        };
    }
}

<?php

namespace App\Service;

use App\Entity\Avis;
use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Repository\AvisRepository;
use App\Repository\ContactRepository;
use App\Repository\DemandeB2BRepository;
use App\Repository\DevisRepository;
use App\Repository\PrestationRepository;
use App\Repository\ReservationRepository;

/**
 * Export RGPD complet des données d'UN centre (portabilité). Rassemble toutes les
 * entités du centre en une structure sérialisable et produit une archive ZIP
 * (export.json + un CSV par entité).
 *
 * Chaque requête est filtrée EXPLICITEMENT sur le centre ciblé (`findBy(['centre' => …])`)
 * → zéro fuite cross-tenant, même sans CentreQueryExtension (le super-admin la bypass).
 * Les PII de {@see Contact} sont déchiffrées à la lecture Doctrine (usage autorisé, tracé
 * côté contrôleur dans l'AuditLog). La logique d'export vit ICI, jamais dans le contrôleur.
 */
final class CentreExportService
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly ContactRepository $contacts,
        private readonly DemandeB2BRepository $demandes,
        private readonly DevisRepository $devis,
        private readonly AvisRepository $avis,
        private readonly PrestationRepository $prestations,
    ) {
    }

    /**
     * Structure complète des données du centre (JSON-sérialisable).
     *
     * @return array<string, mixed>
     */
    public function collect(Centre $centre): array
    {
        return [
            'centre' => [
                'id' => $centre->getId(),
                'nom' => $centre->getNom(),
                'domaine' => $centre->getDomaine(),
                'siteHeroTitre' => $centre->getSiteHeroTitre(),
                'siteHeroSousTitre' => $centre->getSiteHeroSousTitre(),
                'siteDescription' => $centre->getSiteDescription(),
                'openingHours' => $centre->getOpeningHours(),
                'abonnementMensuelCents' => $centre->getAbonnementMensuelCents(),
                'actif' => $centre->isActif(),
                'exporteLe' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ],
            'prestations' => array_map(fn (Prestation $p): array => [
                'id' => $p->getId(), 'nom' => $p->getNom(), 'description' => $p->getDescription(),
                'prixCents' => $p->getPrixCents(), 'ordre' => $p->getOrdre(), 'actif' => $p->isActif(),
                'createdAt' => $this->date($p->getCreatedAt()),
            ], $this->prestations->findBy(['centre' => $centre], ['ordre' => 'ASC'])),
            'reservations' => array_map(fn (Reservation $r): array => [
                'id' => $r->getId(), 'prestation' => $r->getPrestationNom(), 'dateCreneau' => $this->date($r->getDateCreneau()),
                'nbPersonnes' => $r->getNbPersonnes(), 'nomInvite' => $r->getNomInvite(), 'emailInvite' => $r->getEmailInvite(),
                'telephoneInvite' => $r->getTelephoneInvite(), 'montantTotalCents' => $r->getMontantTotalCents(),
                'acompteCents' => $r->getAcompteCents(), 'statut' => $r->getStatut(), 'paidAt' => $this->date($r->getPaidAt()),
                'createdAt' => $this->date($r->getCreatedAt()),
            ], $this->reservations->findBy(['centre' => $centre], ['createdAt' => 'DESC'])),
            'contacts' => array_map(fn (Contact $c): array => [
                'id' => $c->getId(), 'nom' => $c->getNom(), 'email' => $c->getEmail(), 'telephone' => $c->getTelephone(),
                'segments' => $c->getSegments(), 'createdAt' => $this->date($c->getCreatedAt()),
            ], $this->contacts->findBy(['centre' => $centre], ['createdAt' => 'DESC'])),
            'demandesB2B' => array_map(fn (DemandeB2B $d): array => [
                'id' => $d->getId(), 'nomContact' => $d->getNomContact(), 'email' => $d->getEmail(), 'telephone' => $d->getTelephone(),
                'societe' => $d->getSociete(), 'typeEvenement' => $d->getTypeEvenement(), 'nbPersonnes' => $d->getNbPersonnes(),
                'dateSouhaitee' => $this->date($d->getDateSouhaitee()), 'message' => $d->getMessage(), 'statut' => $d->getStatut(),
                'createdAt' => $this->date($d->getCreatedAt()),
            ], $this->demandes->findBy(['centre' => $centre], ['createdAt' => 'DESC'])),
            'devis' => array_map(fn (Devis $d): array => [
                'id' => $d->getId(), 'demandeId' => $d->getDemandeId(), 'lignes' => $d->getLignes(),
                'totalCents' => $d->getTotalCents(), 'statut' => $d->getStatut(), 'notes' => $d->getNotes(),
                'createdAt' => $this->date($d->getCreatedAt()),
            ], $this->devis->findBy(['centre' => $centre], ['createdAt' => 'DESC'])),
            'avis' => array_map(fn (Avis $a): array => [
                'id' => $a->getId(), 'contact' => $a->getContactNom(), 'note' => $a->getNote(), 'commentaire' => $a->getCommentaire(),
                'reponse' => $a->getReponse(), 'statut' => $a->getStatut(), 'createdAt' => $this->date($a->getCreatedAt()),
            ], $this->avis->findBy(['centre' => $centre], ['createdAt' => 'DESC'])),
        ];
    }

    /**
     * Construit une archive ZIP temporaire (export.json + un CSV par entité).
     * Retourne le chemin du fichier (à supprimer après envoi côté contrôleur).
     */
    public function archive(Centre $centre): string
    {
        $data = $this->collect($centre);
        $path = (string) tempnam(sys_get_temp_dir(), 'centre_export_').'.zip';

        $zip = new \ZipArchive();
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('export.json', (string) json_encode($data, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES));
        foreach (['prestations', 'reservations', 'contacts', 'demandesB2B', 'devis', 'avis'] as $entite) {
            $zip->addFromString($entite.'.csv', $this->toCsv($data[$entite]));
        }
        $zip->close();

        return $path;
    }

    private function date(?\DateTimeImmutable $d): ?string
    {
        return $d?->format(\DateTimeInterface::ATOM);
    }

    /**
     * @param list<array<string, mixed>> $rows
     */
    private function toCsv(array $rows): string
    {
        $out = fopen('php://temp', 'r+');
        if ([] !== $rows) {
            fputcsv($out, array_keys($rows[0]), ',', '"', '');
            foreach ($rows as $row) {
                fputcsv($out, array_map(static fn (mixed $v): string => \is_array($v) ? (string) json_encode($v, \JSON_UNESCAPED_UNICODE) : (string) $v, $row), ',', '"', '');
            }
        }
        rewind($out);

        return (string) stream_get_contents($out);
    }
}

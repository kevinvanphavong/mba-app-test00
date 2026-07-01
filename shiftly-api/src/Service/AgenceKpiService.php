<?php

namespace App\Service;

use App\Entity\Reservation;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Agrégats de la console agence (super-admin) : KPI par centre + KPI globaux.
 *
 * Agrégation CROSS-TENANT VOLONTAIRE, réservée au super-admin (les contrôleurs qui
 * l'appellent sont sous `^/api/superadmin`). Lecture seule : que des SELECT groupés
 * (DBAL), aucune écriture. Le CentreQueryExtension ne s'applique pas ici (requêtes
 * SQL directes, hors API Platform).
 */
final class AgenceKpiService
{
    /** Objectif de MRR de l'agence : 10 000 € = 1 000 000 centimes. */
    private const OBJECTIF_MRR_CENTS = 1_000_000;

    private readonly Connection $db;

    public function __construct(EntityManagerInterface $em)
    {
        $this->db = $em->getConnection();
    }

    /**
     * @return array{
     *   mrrCents:int, objectifMrrCents:int, progressionMrrPct:float,
     *   nbCentres:int, nbCentresActifs:int,
     *   iaAppelsMois:int, totalReservations:int, totalAvis:int
     * }
     */
    public function kpisGlobaux(): array
    {
        $mrr = (int) $this->db->fetchOne('SELECT COALESCE(SUM(abonnement_mensuel_cents), 0) FROM centre');
        $nbCentres = (int) $this->db->fetchOne('SELECT COUNT(*) FROM centre');
        $nbActifs = (int) $this->db->fetchOne('SELECT COUNT(*) FROM centre WHERE actif = true');
        $debutMois = (new \DateTimeImmutable('first day of this month 00:00'))->format('Y-m-d H:i:s');
        $iaMois = (int) $this->db->fetchOne('SELECT COUNT(*) FROM ia_usage WHERE created_at >= :d', ['d' => $debutMois]);

        return [
            'mrrCents' => $mrr,
            'objectifMrrCents' => self::OBJECTIF_MRR_CENTS,
            'progressionMrrPct' => round($mrr / self::OBJECTIF_MRR_CENTS * 100, 1),
            'nbCentres' => $nbCentres,
            'nbCentresActifs' => $nbActifs,
            'iaAppelsMois' => $iaMois,
            'totalReservations' => (int) $this->db->fetchOne('SELECT COUNT(*) FROM reservation'),
            'totalAvis' => (int) $this->db->fetchOne('SELECT COUNT(*) FROM avis'),
        ];
    }

    /**
     * KPI par centre (tous les centres). Rapprochés par des agrégats groupés.
     *
     * @return list<array{
     *   id:int, nom:string, actif:bool, abonnementMensuelCents:int,
     *   reservations:int, caEstimeCents:int, noShowRelances:int, avis:int, noteMoyenne:?float
     * }>
     */
    public function kpisParCentre(): array
    {
        $resa = $this->indexer(
            'SELECT centre_id, COUNT(*) AS n,
                    COALESCE(SUM(CASE WHEN statut = :confirmee THEN montant_total_cents ELSE 0 END), 0) AS ca
             FROM reservation GROUP BY centre_id',
            ['confirmee' => Reservation::STATUT_CONFIRMEE],
        );
        $relances = $this->indexer("SELECT centre_id, COUNT(*) AS n FROM relance WHERE motif = 'NO_SHOW' GROUP BY centre_id");
        $avis = $this->indexer('SELECT centre_id, COUNT(*) AS n, AVG(note) AS moy FROM avis GROUP BY centre_id');

        $centres = $this->db->fetchAllAssociative('SELECT id, nom, actif, abonnement_mensuel_cents FROM centre ORDER BY id');

        return array_map(function (array $c) use ($resa, $relances, $avis): array {
            $id = (int) $c['id'];

            return [
                'id' => $id,
                'nom' => (string) $c['nom'],
                'actif' => (bool) $c['actif'],
                'abonnementMensuelCents' => (int) $c['abonnement_mensuel_cents'],
                'reservations' => (int) ($resa[$id]['n'] ?? 0),
                'caEstimeCents' => (int) ($resa[$id]['ca'] ?? 0),
                'noShowRelances' => (int) ($relances[$id]['n'] ?? 0),
                'avis' => (int) ($avis[$id]['n'] ?? 0),
                'noteMoyenne' => isset($avis[$id]['moy']) ? round((float) $avis[$id]['moy'], 2) : null,
            ];
        }, $centres);
    }

    /**
     * Indexe les lignes d'un agrégat groupé par `centre_id`.
     *
     * @param array<string, mixed> $params
     *
     * @return array<int, array<string, mixed>>
     */
    private function indexer(string $sql, array $params = []): array
    {
        $out = [];
        foreach ($this->db->fetchAllAssociative($sql, $params) as $row) {
            $out[(int) $row['centre_id']] = $row;
        }

        return $out;
    }
}

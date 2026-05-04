<?php

namespace App\Service;

use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\Poste;
use App\Entity\PlanningSnapshot;
use App\Entity\PlanningWeek;
use App\Entity\Service;
use App\Entity\User;
use App\Exception\DelaiPrevenanceException;
use Dompdf\Dompdf;
use Dompdf\Options;
use App\Repository\AbsenceRepository;
use App\Repository\PlanningSnapshotRepository;
use App\Repository\PlanningWeekRepository;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use App\Repository\ZoneRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Logique métier du module Planning hebdomadaire.
 */
class PlanningService
{
    public function __construct(
        private readonly ServiceRepository          $serviceRepository,
        private readonly PlanningWeekRepository      $planningWeekRepository,
        private readonly PlanningSnapshotRepository  $planningSnapshotRepository,
        private readonly AbsenceRepository           $absenceRepository,
        private readonly ZoneRepository              $zoneRepository,
        private readonly UserRepository              $userRepository,
        private readonly EntityManagerInterface      $em,
    ) {}

    /**
     * Calcule la durée d'un shift en heures décimales.
     * Gère les shifts de nuit (heureFin < heureDebut).
     */
    public function calculateShiftDuration(Poste $poste): float
    {
        $debut = $poste->getHeureDebut();
        $fin   = $poste->getHeureFin();

        if (!$debut || !$fin) {
            return 0.0;
        }

        $minutes = ($fin->getTimestamp() - $debut->getTimestamp()) / 60;

        // Shift de nuit : ajouter 24h
        if ($minutes < 0) {
            $minutes += 1440;
        }

        $minutes -= $poste->getPauseMinutes();

        return round(max(0.0, $minutes) / 60, 2);
    }

    /**
     * Construit les données complètes d'une semaine de planning.
     *
     * @param Centre             $centre    Centre courant
     * @param \DateTimeImmutable $weekStart Lundi de la semaine
     * @return array Structure correspondant à PlanningWeekData TypeScript
     */
    public function getWeekData(Centre $centre, \DateTimeImmutable $weekStart): array
    {
        $centreId = $centre->getId();
        $weekEnd  = $weekStart->modify('+6 days');

        // ── Récupère les services de la semaine via le repository existant ──
        $services = $this->serviceRepository->findBetween($centreId, $weekStart, $weekEnd);

        // ── Charge les postes de chaque service avec leftJoin user + zone (évite N+1) ──
        $postesParDate = [];
        foreach ($services as $service) {
            $postes = $this->em->createQueryBuilder()
                ->select('p', 'u', 'z')
                ->from(Poste::class, 'p')
                ->leftJoin('p.user', 'u')
                ->leftJoin('p.zone', 'z')
                ->andWhere('p.service = :service')
                ->setParameter('service', $service)
                ->getQuery()
                ->getResult();

            $dateKey = $service->getDate()->format('Y-m-d');
            $postesParDate[$dateKey] = $postes;
        }

        // ── Zones du centre ──
        $zones = $this->zoneRepository->findBy(['centre' => $centre], ['ordre' => 'ASC']);
        $zonesData = array_map(fn($z) => [
            'id'      => $z->getId(),
            'nom'     => $z->getNom(),
            'couleur' => $z->getCouleur() ?? '#6b7280',
        ], $zones);

        // ── Charge les absences de la semaine (une requête pour tous les employés) ──
        $absencesRaw    = $this->absenceRepository->findByCentreAndDateRange($centreId, $weekStart, $weekEnd);
        $absencesByUser = [];
        foreach ($absencesRaw as $a) {
            $absencesByUser[$a->getUser()->getId()][$a->getDate()->format('Y-m-d')] = [
                'id'    => $a->getId(),
                'date'  => $a->getDate()->format('Y-m-d'),
                'type'  => $a->getType(),
                'motif' => $a->getMotif(),
            ];
        }

        // ── Pré-initialise avec tous les staff actifs (même sans shift cette semaine) ──
        $employeesMap = [];
        foreach ($this->userRepository->findActifByCentre($centreId) as $u) {
            $uid = $u->getId();
            $employeesMap[$uid] = [
                'id'          => $uid,
                'nom'         => $u->getNom(),
                'prenom'      => $u->getPrenom(),
                'role'        => $u->getRole(),
                'avatarColor' => $u->getAvatarColor(),
                'heuresHebdo' => $u->getHeuresHebdo(),
                'typeContrat' => $u->getTypeContrat(),
                'shifts'      => [],
                'absences'    => array_values($absencesByUser[$uid] ?? []),
                'totalHeures' => 0.0,
            ];
        }

        // ── Regroupe les shifts par employé ──
        foreach ($postesParDate as $dateStr => $postes) {
            foreach ($postes as $poste) {
                $user   = $poste->getUser();
                $zone   = $poste->getZone();
                $userId = $user->getId();

                if (!isset($employeesMap[$userId])) {
                    $employeesMap[$userId] = [
                        'id'          => $userId,
                        'nom'         => $user->getNom(),
                        'prenom'      => $user->getPrenom(),
                        'role'        => $user->getRole(),
                        'avatarColor' => $user->getAvatarColor(),
                        'heuresHebdo' => $user->getHeuresHebdo(),
                        'typeContrat' => $user->getTypeContrat(),
                        'shifts'      => [],
                        'absences'    => array_values($absencesByUser[$userId] ?? []),
                        'totalHeures' => 0.0,
                    ];
                }

                $duree = $this->calculateShiftDuration($poste);

                $employeesMap[$userId]['shifts'][] = [
                    'posteId'      => $poste->getId(),
                    'serviceId'    => $poste->getService()->getId(),
                    'userId'       => $userId,
                    'date'         => $dateStr,
                    'zoneId'       => $zone->getId(),
                    'zoneNom'      => $zone->getNom(),
                    'zoneCouleur'  => $zone->getCouleur() ?? '#6b7280',
                    'heureDebut'   => $poste->getHeureDebut()?->format('H:i'),
                    'heureFin'     => $poste->getHeureFin()?->format('H:i'),
                    'pauseMinutes' => $poste->getPauseMinutes(),
                ];

                $employeesMap[$userId]['totalHeures'] += $duree;
            }
        }

        // ── Calcule l'écart contrat et arrondit les heures ──
        $employees = [];
        foreach ($employeesMap as $emp) {
            $emp['totalHeures']  = round($emp['totalHeures'], 2);
            $emp['ecartContrat'] = $emp['heuresHebdo'] !== null
                ? round($emp['totalHeures'] - $emp['heuresHebdo'], 2)
                : 0.0;
            $employees[] = $emp;
        }

        // Trier par nom
        usort($employees, fn($a, $b) => strcmp($a['nom'], $b['nom']));

        // ── Statut de la semaine ──
        $planningWeek    = $this->planningWeekRepository->findByCentreAndWeek($centreId, $weekStart);
        $statut          = $planningWeek?->getStatut() ?? PlanningWeek::STATUT_BROUILLON;
        $note            = $planningWeek?->getNote();
        $hasUnpublished  = $planningWeek?->hasUnpublishedChanges() ?? false;
        $lastModifiedAt  = $planningWeek?->getLastModifiedAt()?->format(\DateTimeInterface::ATOM);

        // ── Alertes ──
        $alertes = $this->buildAlerts($employees, $services, $zonesData, $centre, $weekStart);

        // ── Stats ──
        $employesPlanifies = count($employees);
        $totalHeures       = array_sum(array_column($employees, 'totalHeures'));
        $sousPlanifies     = count(array_filter($employees, fn($e) =>
            $e['heuresHebdo'] !== null && $e['ecartContrat'] < -4
        ));
        $creneauxVides = count(array_filter($alertes, fn($a) => $a['type'] === 'ZONE_NON_COUVERTE'));

        return [
            'weekStart'              => $weekStart->format('Y-m-d'),
            'weekEnd'                => $weekEnd->format('Y-m-d'),
            'statut'                 => $statut,
            'publishedAt'            => $planningWeek?->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            'publishedBy'            => $planningWeek?->getPublishedBy()?->getNom(),
            'lastModifiedAt'         => $lastModifiedAt,
            'hasUnpublishedChanges'  => $hasUnpublished,
            'note'                   => $note,
            'zones'                  => $zonesData,
            'employees'              => array_values($employees),
            'alertes'                => $alertes,
            'stats'                  => [
                'employesPlanifies' => $employesPlanifies,
                'totalHeures'       => round($totalHeures, 2),
                'creneauxVides'     => $creneauxVides,
                'sousPlanifies'     => $sousPlanifies,
            ],
        ];
    }

    /**
     * Calcule le nombre de jours calendaires entre aujourd'hui et le lundi de la semaine.
     * Retourne 0 si la semaine est déjà passée ou en cours ce jour.
     */
    public function calculateDelaiPrevenance(\DateTimeImmutable $weekStart): int
    {
        $today = new \DateTimeImmutable('today midnight');
        $diff  = $today->diff($weekStart);
        return max(0, $diff->invert ? -$diff->days : $diff->days);
    }

    /**
     * Crée un snapshot immuable du planning — archivage légal (preuve prud'homale).
     * Appelle getWeekData() pour sérialiser l'état complet en JSON + SHA-256.
     */
    public function createSnapshot(
        Centre $centre,
        \DateTimeImmutable $weekStart,
        User $publisher,
        ?string $motif,
        bool $delaiRespect
    ): PlanningSnapshot {
        $weekData = $this->getWeekData($centre, $weekStart);
        $json     = json_encode($weekData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $checksum = hash('sha256', $json);

        $snapshot = new PlanningSnapshot();
        $snapshot->setCentre($centre);
        $snapshot->setWeekStart($weekStart);
        $snapshot->setPublishedAt(new \DateTimeImmutable());
        $snapshot->setPublishedBy($publisher);
        $snapshot->setData($weekData);
        $snapshot->setMotifModification($motif);
        $snapshot->setChecksum($checksum);
        $snapshot->setDelaiRespect($delaiRespect);

        $this->em->persist($snapshot);

        return $snapshot;
    }

    /**
     * Publie une semaine de planning — crée ou met à jour PlanningWeek → PUBLIE.
     *
     * @throws DelaiPrevenanceException si délai < 7j et forcePublication = false
     * @throws \InvalidArgumentException si forcePublication = true sans motif
     */
    public function publishWeek(
        Centre $centre,
        \DateTimeImmutable $weekStart,
        User $publisher,
        ?string $motif = null,
        bool $force = false
    ): PlanningWeek {
        $delai        = $this->calculateDelaiPrevenance($weekStart);
        $delaiRespect = $delai >= 7;

        if (!$delaiRespect && !$force) {
            throw new DelaiPrevenanceException($delai);
        }

        if (!$delaiRespect && $force && !$motif) {
            throw new \InvalidArgumentException('Un motif est obligatoire pour publier en dehors du délai de prévenance.');
        }

        $centreId = $centre->getId();
        $pw       = $this->planningWeekRepository->findByCentreAndWeek($centreId, $weekStart);

        if (!$pw) {
            $pw = new PlanningWeek();
            $pw->setCentre($centre);
            $pw->setWeekStart($weekStart);
            $this->em->persist($pw);
        }

        $pw->setStatut(PlanningWeek::STATUT_PUBLIE);
        $pw->setPublishedAt(new \DateTimeImmutable());
        $pw->setPublishedBy($publisher);

        // Snapshot immuable créé à chaque publication
        $this->createSnapshot($centre, $weekStart, $publisher, $motif, $delaiRespect);

        $this->em->flush();

        return $pw;
    }

    /**
     * Supprime toutes les assignations Poste d'une semaine pour un centre.
     * Ne touche pas aux dates antérieures au "service du jour" (passé non modifiable).
     * Retourne le nombre de postes supprimés.
     */
    public function clearWeek(Centre $centre, \DateTimeImmutable $weekStart, \DateTimeImmutable $minAllowedDate): int
    {
        $weekEnd = $weekStart->modify('+6 days');

        // Borne basse effective : le plus tardif entre le lundi et la date minimale autorisée
        $effectiveFrom = $weekStart < $minAllowedDate ? $minAllowedDate : $weekStart;

        if ($effectiveFrom > $weekEnd) {
            // Toute la semaine est dans le passé → rien à faire
            return 0;
        }

        $services = $this->serviceRepository->findBetween($centre->getId(), $effectiveFrom, $weekEnd);
        if (empty($services)) {
            return 0;
        }
        $serviceIds = array_map(static fn (Service $s) => $s->getId(), $services);

        // DELETE en masse via DQL (évite de charger les entités Poste en mémoire)
        $deleted = $this->em->createQueryBuilder()
            ->delete(Poste::class, 'p')
            ->where('p.service IN (:serviceIds)')
            ->setParameter('serviceIds', $serviceIds)
            ->getQuery()
            ->execute();

        return (int) $deleted;
    }

    /**
     * Duplique tous les postes d'une semaine source vers une semaine cible.
     * Crée les services cibles si absents. Lève une exception si postes déjà présents.
     */
    public function duplicateWeek(Centre $centre, \DateTimeImmutable $source, \DateTimeImmutable $target): void
    {
        $centreId  = $centre->getId();
        $sourceEnd = $source->modify('+6 days');
        $targetEnd = $target->modify('+6 days');

        // Vérifie qu'aucun poste n'existe sur la semaine cible
        $targetServices = $this->serviceRepository->findBetween($centreId, $target, $targetEnd);
        foreach ($targetServices as $ts) {
            if (count($ts->getPostes()) > 0) {
                throw new \RuntimeException('Des postes existent déjà sur la semaine cible.');
            }
        }

        $sourceServices = $this->serviceRepository->findBetween($centreId, $source, $sourceEnd);

        foreach ($sourceServices as $srcService) {
            $srcPostes = $this->em->createQueryBuilder()
                ->select('p', 'u', 'z')
                ->from(Poste::class, 'p')
                ->leftJoin('p.user', 'u')
                ->leftJoin('p.zone', 'z')
                ->andWhere('p.service = :service')
                ->setParameter('service', $srcService)
                ->getQuery()->getResult();

            if (empty($srcPostes)) {
                continue;
            }

            // Calcule la date cible (décalage = target - source en jours)
            $srcDate  = $srcService->getDate();
            $diffDays = (int) $source->diff($target)->days;
            $tgtDate  = $srcDate->modify("+{$diffDays} days");

            // Trouve ou crée le service cible
            $tgtService = $this->em->getRepository(Service::class)->findOneBy([
                'centre' => $centre,
                'date'   => $tgtDate,
            ]);

            if (!$tgtService) {
                $tgtService = new Service();
                $tgtService->setCentre($centre);
                $tgtService->setDate($tgtDate);
                $tgtService->setStatut('PLANIFIE');
                $this->em->persist($tgtService);
            }

            foreach ($srcPostes as $src) {
                $new = new Poste();
                $new->setService($tgtService);
                $new->setZone($src->getZone());
                $new->setUser($src->getUser());
                $new->setHeureDebut($src->getHeureDebut());
                $new->setHeureFin($src->getHeureFin());
                $new->setPauseMinutes($src->getPauseMinutes());
                $this->em->persist($new);
            }
        }

        $this->em->flush();
    }

    /**
     * Retourne la semaine en cours + les 2 prochaines semaines publiées pour un employé.
     * Conformité IDCC 1790 : prévenance minimum 7 jours.
     */
    public function getEmployeeWeeks(User $user): array
    {
        $centre   = $user->getCentre();
        $centreId = $centre->getId();
        $userId   = $user->getId();
        $today    = new \DateTimeImmutable('today');

        // Lundi de la semaine courante
        $dayOfWeek   = (int) $today->format('N');
        $currentWeek = $dayOfWeek === 1 ? $today : $today->modify('-' . ($dayOfWeek - 1) . ' days');

        // Cherche les 4 prochaines semaines publiées (on en prend 3 max)
        $from    = $currentWeek;
        $to      = $currentWeek->modify('+4 weeks');
        $pubList = $this->planningWeekRepository->findPublishedBetween($centreId, $from, $to);

        $result = [];
        foreach (array_slice($pubList, 0, 3) as $pw) {
            $wStart   = $pw->getWeekStart();
            $wEnd     = $wStart->modify('+6 days');

            // Lecture depuis le dernier snapshot publié — source de vérité légale
            $snapshot = $this->planningSnapshotRepository->findLatestByWeek($centreId, $wStart);

            $shifts = [];
            $total  = 0.0;

            if ($snapshot !== null) {
                $data      = $snapshot->getData();
                $employees = $data['employees'] ?? [];

                // Trouve les données de cet employé dans le snapshot
                foreach ($employees as $emp) {
                    if (($emp['id'] ?? null) !== $userId) {
                        continue;
                    }
                    foreach ($emp['shifts'] ?? [] as $s) {
                        $shifts[] = [
                            'date'         => $s['date'],
                            'zoneNom'      => $s['zoneNom'],
                            'zoneCouleur'  => $s['zoneCouleur'],
                            'heureDebut'   => $s['heureDebut'],
                            'heureFin'     => $s['heureFin'],
                            'pauseMinutes' => $s['pauseMinutes'] ?? 0,
                        ];
                    }
                    $total = (float) ($emp['totalHeures'] ?? 0.0);
                    break;
                }
            } else {
                // Fallback live si aucun snapshot (planning marqué PUBLIE manuellement)
                $services = $this->serviceRepository->findBetween($centreId, $wStart, $wEnd);
                foreach ($services as $service) {
                    $postes = $this->em->createQueryBuilder()
                        ->select('p', 'z')
                        ->from(Poste::class, 'p')
                        ->leftJoin('p.zone', 'z')
                        ->andWhere('p.service = :service')
                        ->andWhere('p.user = :user')
                        ->setParameter('service', $service)
                        ->setParameter('user', $user)
                        ->getQuery()->getResult();

                    foreach ($postes as $poste) {
                        $duree  = $this->calculateShiftDuration($poste);
                        $total += $duree;
                        $shifts[] = [
                            'date'         => $service->getDate()->format('Y-m-d'),
                            'zoneNom'      => $poste->getZone()->getNom(),
                            'zoneCouleur'  => $poste->getZone()->getCouleur() ?? '#6b7280',
                            'heureDebut'   => $poste->getHeureDebut()?->format('H:i'),
                            'heureFin'     => $poste->getHeureFin()?->format('H:i'),
                            'pauseMinutes' => $poste->getPauseMinutes(),
                        ];
                    }
                }
            }

            // Absences de l'employé pour cette semaine
            $absencesRaw = $this->absenceRepository->findByCentreAndDateRange($centreId, $wStart, $wEnd);
            $absences = [];
            foreach ($absencesRaw as $a) {
                if ($a->getUser()->getId() !== $userId) {
                    continue;
                }
                $absences[] = [
                    'id'    => $a->getId(),
                    'date'  => $a->getDate()->format('Y-m-d'),
                    'type'  => $a->getType(),
                    'motif' => $a->getMotif(),
                ];
            }

            $result[] = [
                'weekStart'    => $wStart->format('Y-m-d'),
                'weekEnd'      => $wEnd->format('Y-m-d'),
                'statut'       => PlanningWeek::STATUT_PUBLIE,
                'publishedAt'  => $snapshot?->getPublishedAt()?->format('Y-m-d H:i'),
                'shifts'       => $shifts,
                'absences'     => $absences,
                'totalHeures'  => round($total, 2),
            ];
        }

        return ['weeks' => $result];
    }

    /**
     * Retourne uniquement les alertes d'une semaine (délègue à getWeekData).
     * Utilisé par GET /api/planning/alerts.
     */
    public function getAlerts(Centre $centre, \DateTimeImmutable $weekStart): array
    {
        return $this->getWeekData($centre, $weekStart)['alertes'];
    }

    /**
     * Génère le PDF légal du planning (document pour l'inspection du travail).
     * Retourne le contenu brut du PDF (string binaire).
     */
    /** Convertit un float d'heures en format lisible : 7.75 → "7h45", -0.5 → "-0h30" */
    private function formatHeures(float $h): string
    {
        $sign    = $h < 0 ? '-' : '';
        $abs     = abs($h);
        $heures  = (int) floor($abs);
        $minutes = (int) round(($abs - $heures) * 60);
        if ($minutes === 60) { $heures++; $minutes = 0; }
        return sprintf('%s%dh%02d', $sign, $heures, $minutes);
    }

    /** Idem avec signe forcé pour les écarts : +7h45, -0h30 */
    private function formatEcart(float $h): string
    {
        $sign   = $h >= 0 ? '+' : '-';
        $abs    = abs($h);
        $heures = (int) floor($abs);
        $mins   = (int) round(($abs - $heures) * 60);
        if ($mins === 60) { $heures++; $mins = 0; }
        return sprintf('%s%dh%02d', $sign, $heures, $mins);
    }

    public function generatePdf(Centre $centre, \DateTimeImmutable $weekStart): string
    {
        $data    = $this->getWeekData($centre, $weekStart);
        $weekEnd = $weekStart->modify('+6 days');

        $JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $dates[] = $weekStart->modify("+{$i} days")->format('Y-m-d');
        }

        // ── Construction de l'HTML ──
        $publishedAt = '';
        if (!empty($data['publishedAt'])) {
            $publishedAt = (new \DateTimeImmutable($data['publishedAt']))->format('d/m/Y à H:i');
        } else {
            $publishedAt = 'Non publié';
        }

        $rows = '';
        foreach ($data['employees'] as $emp) {
            // Indexe les shifts par date
            $shiftsByDate = [];
            foreach ($emp['shifts'] as $s) {
                $shiftsByDate[$s['date']][] = $s;
            }

            $cells = '';
            foreach ($dates as $date) {
                $content = '';
                foreach ($shiftsByDate[$date] ?? [] as $s) {
                    $hd    = $s['heureDebut']    ?? '—';
                    $hf    = $s['heureFin']       ?? '—';
                    $pause = ($s['pauseMinutes'] ?? 0) > 0
                        ? "<div style='font-size:7px;color:#9ca3af;'>pause {$s['pauseMinutes']}min</div>"
                        : '';
                    $content .= "<div style='font-size:9px;font-weight:600;'>{$hd}–{$hf}</div>";
                    $content .= "<div style='font-size:8px;color:#6b7280;'>{$s['zoneNom']}</div>";
                    $content .= $pause;
                }
                if (!$content) $content = "<span style='color:#d1d5db;'>—</span>";
                $cells .= "<td style='border:1px solid #e5e7eb;padding:4px 6px;text-align:center;vertical-align:top;min-width:60px;'>{$content}</td>";
            }

            $total   = $this->formatHeures($emp['totalHeures']);
            $contrat = $emp['heuresHebdo'] !== null ? $emp['heuresHebdo'] . 'h' : '—';
            $ecart   = $emp['heuresHebdo'] !== null
                ? $this->formatEcart($emp['ecartContrat'])
                : '—';

            // Vert < -3h | Rouge entre -3h et +3h | Orange/marron > +3h
            $ecartVal = $emp['ecartContrat'];
            if ($ecartVal < -3) {
                $ecartColor = '#16a34a'; // vert
            } elseif ($ecartVal <= 3) {
                $ecartColor = '#ef4444'; // rouge
            } else {
                $ecartColor = '#f97316'; // orange/marron
            }

            $prenom = htmlspecialchars($emp['prenom'] ?? '');
            $nom    = htmlspecialchars($emp['nom']    ?? '');

            $rows .= "
            <tr>
              <td style='border:1px solid #e5e7eb;padding:5px 8px;font-size:11px;white-space:nowrap;'>
                <span style='font-weight:700;'>{$prenom} {$nom}</span><br>
                <span style='color:#6b7280;font-size:9px;'>{$emp['typeContrat']} — {$contrat}</span>
              </td>
              {$cells}
              <td style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;font-size:11px;font-weight:700;'>{$total}h</td>
              <td style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;font-size:11px;color:{$ecartColor};font-weight:700;'>{$ecart}h</td>
            </tr>";
        }

        $headerCells = '';
        foreach ($JOURS as $i => $j) {
            $d = new \DateTimeImmutable($dates[$i]);
            $headerCells .= "<th>{$j}<br><span style='font-weight:400;font-size:9px;color:#6b7280;'>{$d->format('d/m')}</span></th>";
        }

        $generatedAt = (new \DateTimeImmutable())->format('d/m/Y à H:i');
        $statut = $data['statut'] === 'PUBLIE' ? '✓ Publié' : 'Brouillon';
        $statutColor = $data['statut'] === 'PUBLIE' ? '#22c55e' : '#f97316';

        $html = "
        <!DOCTYPE html>
        <html lang='fr'>
        <head>
          <meta charset='utf-8'>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Helvetica, Arial, sans-serif;
              color: #111827;
              margin: 0;
              padding: 20px 24px;
              font-size: 11px;
              line-height: 1.4;
            }
            h1 {
              font-family: Helvetica, Arial, sans-serif;
              font-size: 20px;
              font-weight: 900;
              letter-spacing: -0.4px;
              margin: 0;
              color: #f97316;
            }
            table { width: 100%; border-collapse: collapse; }
            th {
              font-family: Helvetica, Arial, sans-serif;
              font-weight: 700;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #e5e7eb;
              padding: 5px 6px;
              text-align: center;
            }
            th.col-emp { text-align: left; min-width: 130px; }
            td { border: 1px solid #e5e7eb; padding: 4px 6px; vertical-align: top; }
            tr:nth-child(even) td { background: #fafafa; }
            .legend { display: flex; gap: 16px; margin-top: 10px; font-size: 9px; color: #6b7280; }
            .legend-item { display: flex; align-items: center; gap: 4px; }
            .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
          </style>
        </head>
        <body>

          <!-- En-tête -->
          <div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;border-bottom:2px solid #f97316;padding-bottom:10px;'>
            <div>
              <h1>Planning — {$centre->getNom()}</h1>
              <p style='margin:3px 0 0;font-size:11px;color:#6b7280;letter-spacing:0.2px;'>
                Semaine du {$weekStart->format('d/m/Y')} au {$weekEnd->format('d/m/Y')}
              </p>
            </div>
            <div style='text-align:right;'>
              <p style='margin:0;font-size:11px;color:{$statutColor};font-weight:700;letter-spacing:0.3px;'>{$statut}</p>
              <p style='margin:2px 0 0;font-size:10px;color:#6b7280;'>Communiqué le : {$publishedAt}</p>
              <p style='margin:2px 0 0;font-size:9px;color:#9ca3af;'>Généré le {$generatedAt}</p>
            </div>
          </div>

          <!-- Tableau planning -->
          <table>
            <thead>
              <tr>
                <th class='col-emp'>Employé</th>
                {$headerCells}
                <th style='min-width:44px;'>Total</th>
                <th style='min-width:44px;'>Écart</th>
              </tr>
            </thead>
            <tbody>
              {$rows}
            </tbody>
          </table>

          <!-- Légende écarts -->
          <div class='legend'>
            <div class='legend-item'><span class='dot' style='background:#16a34a;'></span> Écart &lt; −3h</div>
            <div class='legend-item'><span class='dot' style='background:#ef4444;'></span> Écart entre −3h et +3h</div>
            <div class='legend-item'><span class='dot' style='background:#f97316;'></span> Écart &gt; +3h</div>
          </div>

          <!-- Pied de page légal -->
          <p style='margin-top:14px;font-size:8.5px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:7px;'>
            Document généré par Shiftly — Conservation minimum 3 ans (Art. L3171-1 C. travail).
            Ce planning constitue le décompte légal du temps de travail.
            Convention Collective IDCC 1790 — Espaces de loisirs, attractions et culturels.
          </p>
        </body>
        </html>";

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }

    /**
     * Génère les alertes métier (ZONE_NON_COUVERTE, SANS_PAUSE) et légales.
     */
    private function buildAlerts(array $employees, array $services, array $zones, Centre $centre, \DateTimeImmutable $weekStart): array
    {
        $alertes = [];

        // Indexe les shifts par date + zoneId
        $couvertureParDate = [];
        foreach ($employees as $emp) {
            foreach ($emp['shifts'] as $shift) {
                $couvertureParDate[$shift['date']][$shift['zoneId']] = true;

                // Alerte SANS_PAUSE métier : shift > 6h sans aucune pause
                if ($shift['heureDebut'] && $shift['heureFin']) {
                    $debut = \DateTimeImmutable::createFromFormat('H:i', $shift['heureDebut']);
                    $fin   = \DateTimeImmutable::createFromFormat('H:i', $shift['heureFin']);
                    if ($debut && $fin) {
                        $minutes = ($fin->getTimestamp() - $debut->getTimestamp()) / 60;
                        if ($minutes < 0) $minutes += 1440;
                        if ($minutes > 360 && $shift['pauseMinutes'] === 0) {
                            $alertes[] = [
                                'type'      => 'SANS_PAUSE',
                                'severite'  => 'moyenne',
                                'categorie' => 'metier',
                                'message'   => sprintf(
                                    'Shift de %.0fh sans pause pour %s le %s',
                                    $minutes / 60, $emp['nom'], $shift['date']
                                ),
                                'date'   => $shift['date'],
                                'userId' => $emp['id'],
                            ];
                        }
                    }
                }
            }
        }

        // Alerte ZONE_NON_COUVERTE métier
        foreach ($services as $service) {
            $dateStr = $service->getDate()->format('Y-m-d');
            foreach ($zones as $zone) {
                if (!isset($couvertureParDate[$dateStr][$zone['id']])) {
                    $alertes[] = [
                        'type'      => 'ZONE_NON_COUVERTE',
                        'severite'  => 'haute',
                        'categorie' => 'metier',
                        'message'   => sprintf('%s non couverte le %s', $zone['nom'], $dateStr),
                        'date'      => $dateStr,
                        'zoneId'    => $zone['id'],
                    ];
                }
            }
        }

        // Alertes légales Code du travail
        $alertes = array_merge($alertes, $this->getLegalAlerts($employees, $centre, $weekStart));

        // Trie : haute en premier, légal avant métier à sévérité égale
        usort($alertes, function ($a, $b) {
            $sevCmp = strcmp($b['severite'], $a['severite']);
            if ($sevCmp !== 0) return $sevCmp;
            return strcmp($b['categorie'] ?? 'metier', $a['categorie'] ?? 'metier');
        });

        return $alertes;
    }

    /**
     * Calcule les 6 alertes légales du Code du travail à partir des shifts de la semaine.
     *
     * Alertes : MAX_JOURNALIER, MAX_HEBDO_ABSOLU, MAX_HEBDO_MOYENNE,
     *           REPOS_QUOTIDIEN, REPOS_HEBDO, PAUSE_6H
     */
    private function getLegalAlerts(array $employees, Centre $centre, \DateTimeImmutable $weekStart): array
    {
        $alertes = [];

        foreach ($employees as $emp) {
            $shifts = $emp['shifts'];

            // Dates marquées comme absences — on les exclut des alertes légales
            $absenceDates = array_column($emp['absences'] ?? [], 'date');

            // Regroupe et trie les shifts par date (hors jours d'absence)
            $shiftsByDate = [];
            foreach ($shifts as $shift) {
                if (in_array($shift['date'], $absenceDates, true)) continue;
                $shiftsByDate[$shift['date']][] = $shift;
            }
            ksort($shiftsByDate);

            // ── MAX_JOURNALIER : > 10h sur un même jour ──────────────────────
            foreach ($shiftsByDate as $date => $dayShifts) {
                $totalMin = 0;
                foreach ($dayShifts as $s) {
                    if (!$s['heureDebut'] || !$s['heureFin']) continue;
                    $d = \DateTimeImmutable::createFromFormat('H:i', $s['heureDebut']);
                    $f = \DateTimeImmutable::createFromFormat('H:i', $s['heureFin']);
                    if (!$d || !$f) continue;
                    $min = ($f->getTimestamp() - $d->getTimestamp()) / 60;
                    if ($min < 0) $min += 1440;
                    $totalMin += max(0, $min - $s['pauseMinutes']);
                }
                if ($totalMin > 600) {
                    $alertes[] = [
                        'type'       => 'MAX_JOURNALIER',
                        'severite'   => 'haute',
                        'categorie'  => 'legal',
                        'baseLegale' => 'Art. L3121-18 C. travail',
                        'message'    => sprintf('%s dépasse 10h le %s (%.1fh planifiées)', $emp['nom'], $date, $totalMin / 60),
                        'date'       => $date,
                        'userId'     => $emp['id'],
                    ];
                }
            }

            // ── MAX_HEBDO_ABSOLU : > 48h sur la semaine ──────────────────────
            if ($emp['totalHeures'] > 48) {
                $alertes[] = [
                    'type'       => 'MAX_HEBDO_ABSOLU',
                    'severite'   => 'haute',
                    'categorie'  => 'legal',
                    'baseLegale' => 'Art. L3121-20 C. travail',
                    'message'    => sprintf('%s dépasse 48h cette semaine (%.1fh)', $emp['nom'], $emp['totalHeures']),
                    'userId'     => $emp['id'],
                ];
            }

            // ── PAUSE_6H : shift > 6h avec pause < 20 min ───────────────────
            foreach ($shifts as $s) {
                if (in_array($s['date'], $absenceDates, true)) continue;
                if (!$s['heureDebut'] || !$s['heureFin']) continue;
                $d = \DateTimeImmutable::createFromFormat('H:i', $s['heureDebut']);
                $f = \DateTimeImmutable::createFromFormat('H:i', $s['heureFin']);
                if (!$d || !$f) continue;
                $min = ($f->getTimestamp() - $d->getTimestamp()) / 60;
                if ($min < 0) $min += 1440;
                if ($min > 360 && $s['pauseMinutes'] < 20) {
                    $alertes[] = [
                        'type'       => 'PAUSE_6H',
                        'severite'   => 'moyenne',
                        'categorie'  => 'legal',
                        'baseLegale' => 'Art. L3121-16 C. travail',
                        'message'    => sprintf('%s : shift de %.0fh, pause insuffisante (%dmin) le %s', $emp['nom'], $min / 60, $s['pauseMinutes'], $s['date']),
                        'date'       => $s['date'],
                        'userId'     => $emp['id'],
                    ];
                }
            }

            // ── REPOS_QUOTIDIEN : < 11h entre dernier shift J et premier J+1 ─
            $dates = array_keys($shiftsByDate);
            foreach ($dates as $i => $date) {
                if (!isset($dates[$i + 1])) continue;
                $nextDate = $dates[$i + 1];

                // Vérifie que c'est bien le lendemain
                $diff = (new \DateTimeImmutable($nextDate))->diff(new \DateTimeImmutable($date));
                if ($diff->days !== 1) continue;

                // Dernier shift du jour J (trié par heureFin)
                $dayShifts     = $shiftsByDate[$date];
                $nextDayShifts = $shiftsByDate[$nextDate];

                $lastFin   = null;
                $firstDeb  = null;

                foreach ($dayShifts as $s) {
                    if (!$s['heureFin']) continue;
                    $ts = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . $s['heureFin']);
                    if ($ts && (!$lastFin || $ts > $lastFin)) $lastFin = $ts;
                }
                foreach ($nextDayShifts as $s) {
                    if (!$s['heureDebut']) continue;
                    $ts = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $nextDate . ' ' . $s['heureDebut']);
                    if ($ts && (!$firstDeb || $ts < $firstDeb)) $firstDeb = $ts;
                }

                if ($lastFin && $firstDeb) {
                    $repos = ($firstDeb->getTimestamp() - $lastFin->getTimestamp()) / 3600;
                    if ($repos < 11) {
                        $alertes[] = [
                            'type'       => 'REPOS_QUOTIDIEN',
                            'severite'   => 'haute',
                            'categorie'  => 'legal',
                            'baseLegale' => 'Art. L3131-1 C. travail',
                            'message'    => sprintf('%s : repos de %.0fh entre %s et %s (11h requises)', $emp['nom'], max(0, $repos), $date, $nextDate),
                            'date'       => $date,
                            'userId'     => $emp['id'],
                        ];
                    }
                }
            }

            // ── REPOS_HEBDO : plage consécutive sans shift < 35h ────────────
            if (!empty($shifts)) {
                $workSlots = [];
                foreach ($shifts as $s) {
                    if (in_array($s['date'], $absenceDates, true)) continue;
                    if (!$s['heureDebut'] || !$s['heureFin']) continue;
                    $start = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $s['date'] . ' ' . $s['heureDebut']);
                    $end   = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $s['date'] . ' ' . $s['heureFin']);
                    if (!$start || !$end) continue;
                    $startTs = $start->getTimestamp();
                    $endTs   = $end->getTimestamp();
                    if ($endTs < $startTs) $endTs += 86400; // shift de nuit
                    $workSlots[] = [$startTs, $endTs];
                }

                if (!empty($workSlots)) {
                    usort($workSlots, fn($a, $b) => $a[0] <=> $b[0]);

                    // Calcule la plus longue plage de repos dans la semaine
                    $firstShiftStart = $workSlots[0][0];
                    $lastShiftEnd    = end($workSlots)[1];
                    $maxRepos        = 0.0;
                    $prev            = $firstShiftStart;

                    foreach ($workSlots as $slot) {
                        $gap      = ($slot[0] - $prev) / 3600;
                        $maxRepos = max($maxRepos, $gap);
                        $prev     = $slot[1];
                    }

                    if ($maxRepos < 35) {
                        $alertes[] = [
                            'type'       => 'REPOS_HEBDO',
                            'severite'   => 'haute',
                            'categorie'  => 'legal',
                            'baseLegale' => 'Art. L3132-2 C. travail',
                            'message'    => sprintf('%s : repos hebdo insuffisant (%.0fh consécutives, 35h requises)', $emp['nom'], $maxRepos),
                            'userId'     => $emp['id'],
                        ];
                    }
                }
            }
        }

        // ── MAX_HEBDO_MOYENNE : > 44h de moyenne sur 12 semaines glissantes ─
        // Charge les postes des 11 semaines précédentes en une seule requête DQL
        $twelveWeeksAgo = $weekStart->modify('-11 weeks');
        $weekEndCurrent = $weekStart->modify('+6 days');

        $userIds = array_column($employees, 'id');
        if (!empty($userIds)) {
            $histoPostes = $this->em->createQueryBuilder()
                ->select('p', 's', 'u')
                ->from(Poste::class, 'p')
                ->join('p.service', 's')
                ->join('p.user', 'u')
                ->andWhere('s.centre = :centre')
                ->andWhere('s.date BETWEEN :from AND :to')
                ->andWhere('p.user IN (:userIds)')
                ->setParameter('centre', $centre)
                ->setParameter('from', $twelveWeeksAgo, Types::DATE_IMMUTABLE)
                ->setParameter('to', $weekEndCurrent, Types::DATE_IMMUTABLE)
                ->setParameter('userIds', $userIds)
                ->getQuery()
                ->getResult();

            // Indexe les heures histo par userId et par numéro de semaine ISO
            $heuresParUserSemaine = [];
            foreach ($histoPostes as $p) {
                $uid   = $p->getUser()->getId();
                $wNum  = $p->getService()->getDate()->format('o-W'); // ex: 2026-15
                $heuresParUserSemaine[$uid][$wNum] = ($heuresParUserSemaine[$uid][$wNum] ?? 0.0)
                    + $this->calculateShiftDuration($p);
            }

            foreach ($employees as $emp) {
                $uid     = $emp['id'];
                $semaines = $heuresParUserSemaine[$uid] ?? [];

                // Complète la semaine courante si absente de l'historique (pas encore de postes finaux)
                $currentWNum = $weekStart->format('o-W');
                if (!isset($semaines[$currentWNum])) {
                    $semaines[$currentWNum] = $emp['totalHeures'];
                }

                if (count($semaines) < 2) {
                    continue; // Pas assez de données pour calculer une moyenne significative
                }

                $moyenne = array_sum($semaines) / count($semaines);

                if ($moyenne > 44) {
                    $alertes[] = [
                        'type'       => 'MAX_HEBDO_MOYENNE',
                        'severite'   => 'haute',
                        'categorie'  => 'legal',
                        'baseLegale' => 'Art. L3121-22 C. travail',
                        'message'    => sprintf(
                            '%s : moyenne de %.1fh/semaine sur %d semaines (44h max)',
                            $emp['nom'], $moyenne, count($semaines)
                        ),
                        'userId' => $uid,
                    ];
                }
            }
        }

        return $alertes;
    }
}

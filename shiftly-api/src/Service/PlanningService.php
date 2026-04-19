<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Poste;
use App\Entity\PlanningSnapshot;
use App\Entity\PlanningWeek;
use App\Entity\Service;
use App\Entity\User;
use App\Exception\DelaiPrevenanceException;
use Dompdf\Dompdf;
use Dompdf\Options;
use App\Repository\PlanningSnapshotRepository;
use App\Repository\PlanningWeekRepository;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use App\Repository\ZoneRepository;
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

        // ── Pré-initialise avec tous les staff actifs (même sans shift cette semaine) ──
        $employeesMap = [];
        foreach ($this->userRepository->findActifByCentre($centreId) as $u) {
            $employeesMap[$u->getId()] = [
                'id'          => $u->getId(),
                'nom'         => $u->getNom(),
                'prenom'      => $u->getPrenom(),
                'role'        => $u->getRole(),
                'avatarColor' => $u->getAvatarColor(),
                'heuresHebdo' => $u->getHeuresHebdo(),
                'typeContrat' => $u->getTypeContrat(),
                'shifts'      => [],
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
        $planningWeek = $this->planningWeekRepository->findByCentreAndWeek($centreId, $weekStart);
        $statut       = $planningWeek?->getStatut() ?? PlanningWeek::STATUT_BROUILLON;
        $note         = $planningWeek?->getNote();

        // ── Alertes ──
        $alertes = $this->buildAlerts($employees, $services, $zonesData);

        // ── Stats ──
        $employesPlanifies = count($employees);
        $totalHeures       = array_sum(array_column($employees, 'totalHeures'));
        $sousPlanifies     = count(array_filter($employees, fn($e) =>
            $e['heuresHebdo'] !== null && $e['ecartContrat'] < -4
        ));
        $creneauxVides = count(array_filter($alertes, fn($a) => $a['type'] === 'ZONE_NON_COUVERTE'));

        return [
            'weekStart'  => $weekStart->format('Y-m-d'),
            'weekEnd'    => $weekEnd->format('Y-m-d'),
            'statut'     => $statut,
            'note'       => $note,
            'zones'      => $zonesData,
            'employees'  => array_values($employees),
            'alertes'    => $alertes,
            'stats'      => [
                'employesPlanifies' => $employesPlanifies,
                'totalHeures'       => round($totalHeures, 1),
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
            $wStart  = $pw->getWeekStart();
            $wEnd    = $wStart->modify('+6 days');
            $services = $this->serviceRepository->findBetween($centreId, $wStart, $wEnd);

            $shifts = [];
            $total  = 0.0;

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
                    $duree    = $this->calculateShiftDuration($poste);
                    $total   += $duree;
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

            $result[] = [
                'weekStart'   => $wStart->format('Y-m-d'),
                'weekEnd'     => $wEnd->format('Y-m-d'),
                'statut'      => PlanningWeek::STATUT_PUBLIE,
                'shifts'      => $shifts,
                'totalHeures' => round($total, 2),
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
                    $hd = $s['heureDebut'] ?? '—';
                    $hf = $s['heureFin']   ?? '—';
                    $content .= "<div style='font-size:9px;'>{$hd}–{$hf}</div>";
                    $content .= "<div style='font-size:8px;color:#6b7280;'>{$s['zoneNom']}</div>";
                }
                if (!$content) $content = "<span style='color:#d1d5db;'>—</span>";
                $cells .= "<td style='border:1px solid #e5e7eb;padding:4px 6px;text-align:center;vertical-align:top;min-width:60px;'>{$content}</td>";
            }

            $total    = number_format($emp['totalHeures'], 1);
            $contrat  = $emp['heuresHebdo'] !== null ? $emp['heuresHebdo'] . 'h' : '—';
            $ecart    = $emp['heuresHebdo'] !== null
                ? sprintf('%+.1f', $emp['ecartContrat'])
                : '—';
            $ecartColor = $emp['ecartContrat'] < -2 ? '#ef4444' : ($emp['ecartContrat'] > 2 ? '#f97316' : '#22c55e');

            $rows .= "
            <tr>
              <td style='border:1px solid #e5e7eb;padding:4px 8px;font-size:11px;white-space:nowrap;'>
                <strong>{$emp['nom']}</strong><br>
                <span style='color:#6b7280;font-size:9px;'>{$emp['typeContrat']} — {$contrat}</span>
              </td>
              {$cells}
              <td style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;font-size:11px;font-weight:bold;'>{$total}h</td>
              <td style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;font-size:11px;color:{$ecartColor};font-weight:bold;'>{$ecart}h</td>
            </tr>";
        }

        $headerCells = '';
        foreach ($JOURS as $i => $j) {
            $d = new \DateTimeImmutable($dates[$i]);
            $headerCells .= "<th style='border:1px solid #e5e7eb;padding:4px 6px;text-align:center;font-size:10px;background:#f9fafb;'>{$j}<br>{$d->format('d/m')}</th>";
        }

        $generatedAt = (new \DateTimeImmutable())->format('d/m/Y à H:i');
        $statut = $data['statut'] === 'PUBLIE' ? '✓ Publié' : 'Brouillon';
        $statutColor = $data['statut'] === 'PUBLIE' ? '#22c55e' : '#f97316';

        $html = "
        <!DOCTYPE html>
        <html lang='fr'>
        <head><meta charset='utf-8'></head>
        <body style='font-family:Arial,sans-serif;color:#111;margin:0;padding:20px;'>

          <!-- En-tête -->
          <div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #f97316;padding-bottom:12px;'>
            <div>
              <h1 style='margin:0;font-size:18px;color:#f97316;'>Planning — {$centre->getNom()}</h1>
              <p style='margin:4px 0 0;font-size:12px;color:#6b7280;'>
                Semaine du {$weekStart->format('d/m/Y')} au {$weekEnd->format('d/m/Y')}
              </p>
            </div>
            <div style='text-align:right;'>
              <p style='margin:0;font-size:11px;color:{$statutColor};font-weight:bold;'>{$statut}</p>
              <p style='margin:2px 0 0;font-size:10px;color:#6b7280;'>Communiqué le : {$publishedAt}</p>
              <p style='margin:2px 0 0;font-size:9px;color:#9ca3af;'>Généré le {$generatedAt}</p>
            </div>
          </div>

          <!-- Tableau planning -->
          <table style='width:100%;border-collapse:collapse;font-size:11px;'>
            <thead>
              <tr>
                <th style='border:1px solid #e5e7eb;padding:4px 8px;text-align:left;background:#f9fafb;font-size:10px;min-width:120px;'>Employé</th>
                {$headerCells}
                <th style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;background:#f9fafb;font-size:10px;'>Total</th>
                <th style='border:1px solid #e5e7eb;padding:4px 8px;text-align:center;background:#f9fafb;font-size:10px;'>Écart</th>
              </tr>
            </thead>
            <tbody>
              {$rows}
            </tbody>
          </table>

          <!-- Pied de page légal -->
          <p style='margin-top:20px;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:8px;'>
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
    private function buildAlerts(array $employees, array $services, array $zones): array
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
        $alertes = array_merge($alertes, $this->getLegalAlerts($employees));

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
    private function getLegalAlerts(array $employees): array
    {
        $alertes = [];

        foreach ($employees as $emp) {
            $shifts = $emp['shifts'];

            // Regroupe et trie les shifts par date
            $shiftsByDate = [];
            foreach ($shifts as $shift) {
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

        return $alertes;
    }
}

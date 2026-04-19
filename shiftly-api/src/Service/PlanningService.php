<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Poste;
use App\Entity\PlanningSnapshot;
use App\Entity\PlanningWeek;
use App\Entity\Service;
use App\Entity\User;
use App\Exception\DelaiPrevenanceException;
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
     * Génère les alertes pour la semaine (ZONE_NON_COUVERTE + SANS_PAUSE).
     */
    private function buildAlerts(array $employees, array $services, array $zones): array
    {
        $alertes = [];

        // Indexe les shifts par date + zoneId
        $couvertureParDate = [];
        foreach ($employees as $emp) {
            foreach ($emp['shifts'] as $shift) {
                $couvertureParDate[$shift['date']][$shift['zoneId']] = true;

                // Alerte SANS_PAUSE : shift > 6h sans pause
                if ($shift['heureDebut'] && $shift['heureFin']) {
                    $debut = \DateTimeImmutable::createFromFormat('H:i', $shift['heureDebut']);
                    $fin   = \DateTimeImmutable::createFromFormat('H:i', $shift['heureFin']);
                    if ($debut && $fin) {
                        $minutes = ($fin->getTimestamp() - $debut->getTimestamp()) / 60;
                        if ($minutes < 0) $minutes += 1440;
                        if ($minutes > 360 && $shift['pauseMinutes'] === 0) {
                            $alertes[] = [
                                'type'     => 'SANS_PAUSE',
                                'severite' => 'moyenne',
                                'message'  => sprintf(
                                    'Shift de %.0fh sans pause pour %s le %s',
                                    $minutes / 60,
                                    $emp['nom'],
                                    $shift['date']
                                ),
                                'date'   => $shift['date'],
                                'userId' => $emp['id'],
                            ];
                        }
                    }
                }
            }
        }

        // Alerte ZONE_NON_COUVERTE : zone sans poste sur un jour avec service
        foreach ($services as $service) {
            $dateStr = $service->getDate()->format('Y-m-d');
            foreach ($zones as $zone) {
                if (!isset($couvertureParDate[$dateStr][$zone['id']])) {
                    $alertes[] = [
                        'type'     => 'ZONE_NON_COUVERTE',
                        'severite' => 'haute',
                        'message'  => sprintf('%s non couverte le %s', $zone['nom'], $dateStr),
                        'date'     => $dateStr,
                        'zoneId'   => $zone['id'],
                    ];
                }
            }
        }

        // Trie par sévérité : haute en premier
        usort($alertes, fn($a, $b) => strcmp($b['severite'], $a['severite']));

        return $alertes;
    }
}

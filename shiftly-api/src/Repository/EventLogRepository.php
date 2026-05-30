<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\EventLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repository EventLog.
 *
 * Choix d'agrégation PHP plutôt que JSON_EXTRACT pour rester portable
 * MySQL / PostgreSQL / SQLite (cf. CLAUDE.md règle 15 + EVENTLOG_MODULE.md §8).
 * Les FK (mission_id, user_id) sont remontées via IDENTITY() — le payload
 * reste à 8 clés snapshot (cf. §4 de la spec).
 *
 * Volume attendu : ~quelques milliers de lignes/mois par centre → acceptable.
 */
class EventLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventLog::class);
    }

    /**
     * @return array{
     *   totalChecks:int,
     *   totalUnchecks:int,
     *   tauxCompletionParZone:list<array{zone:?string,couleur:?string,taux:float,checks:int,unchecks:int}>,
     *   missionsLesPlusOubliees:list<array{missionId:?int,missionNom:?string,zoneNom:?string,priorite:?string,fois:int}>,
     *   rankingStaff:list<array{userId:?int,userNom:?string,checks:int,services:int,tauxPersonnel:float}>,
     *   servicesRecents:list<array{serviceId:?int,serviceDate:?string,serviceCreneau:?string,checks:int,unchecks:int}>
     * }
     */
    public function findCompletionHistory(Centre $centre, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        $rows = $this->createQueryBuilder('e')
            ->select(
                'e.action AS action',
                'e.payload AS payload',
                'e.occurredAt AS occurredAt',
                'IDENTITY(e.mission) AS missionId',
                'IDENTITY(e.user) AS userId'
            )
            ->andWhere('e.centre = :c')
            ->andWhere('e.entityType = :t')
            ->andWhere('e.occurredAt >= :from')
            ->andWhere('e.occurredAt <= :to')
            ->setParameter('c', $centre)
            ->setParameter('t', EventLog::ENTITY_COMPLETION)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->getQuery()
            ->getArrayResult();

        $totalChecks   = 0;
        $totalUnchecks = 0;

        /** @var array<string, array{zone:?string,couleur:?string,checks:int,unchecks:int}> */
        $zones = [];

        /** @var array<int, array{missionId:int,missionNom:?string,zoneNom:?string,priorite:?string,checks:int,unchecks:int}> */
        $missions = [];

        /** @var array<int, array{userId:int,userNom:?string,checks:int,unchecks:int,services:array<int,true>}> */
        $users = [];

        /** @var array<int, array{serviceId:int,serviceDate:?string,serviceCreneau:?string,checks:int,unchecks:int,lastAt:?string}> */
        $services = [];

        foreach ($rows as $r) {
            $payload  = is_array($r['payload']) ? $r['payload'] : [];
            $action   = $r['action'] ?? null;
            $zoneNom  = $payload['zoneNom']        ?? null;
            $zoneCol  = $payload['zoneCouleur']    ?? null;
            $mNom     = $payload['missionNom']     ?? null;
            $mPrio    = $payload['missionPriorite']?? null;
            $uNom     = $payload['userNom']        ?? null;
            $sId      = isset($payload['serviceId']) ? (int) $payload['serviceId'] : null;
            $sDate    = $payload['serviceDate']    ?? null;
            $sCre     = $payload['serviceCreneau'] ?? null;
            $mId      = isset($r['missionId']) ? (int) $r['missionId'] : null;
            $uId      = isset($r['userId'])    ? (int) $r['userId']    : null;
            $occurred = $r['occurredAt'] ?? null;

            $isCheck   = $action === EventLog::ACTION_CHECK;
            $isUncheck = $action === EventLog::ACTION_UNCHECK;

            if ($isCheck)   $totalChecks++;
            if ($isUncheck) $totalUnchecks++;

            // Zones (groupées par nom)
            if ($zoneNom !== null) {
                $zones[$zoneNom] ??= ['zone' => $zoneNom, 'couleur' => $zoneCol, 'checks' => 0, 'unchecks' => 0];
                if ($isCheck)   $zones[$zoneNom]['checks']++;
                if ($isUncheck) $zones[$zoneNom]['unchecks']++;
            }

            // Missions (bucket par FK missionId si dispo, sinon ignorer)
            if ($mId !== null) {
                $missions[$mId] ??= [
                    'missionId' => $mId,
                    'missionNom' => $mNom,
                    'zoneNom' => $zoneNom,
                    'priorite' => $mPrio,
                    'checks' => 0,
                    'unchecks' => 0,
                ];
                if ($isCheck)   $missions[$mId]['checks']++;
                if ($isUncheck) $missions[$mId]['unchecks']++;
            }

            // Users (bucket par FK userId)
            if ($uId !== null) {
                $users[$uId] ??= [
                    'userId'   => $uId,
                    'userNom'  => $uNom,
                    'checks'   => 0,
                    'unchecks' => 0,
                    'services' => [],
                ];
                if ($isCheck)   $users[$uId]['checks']++;
                if ($isUncheck) $users[$uId]['unchecks']++;
                if ($sId !== null) $users[$uId]['services'][$sId] = true;
            }

            // Services récents (bucket par serviceId payload)
            if ($sId !== null) {
                $services[$sId] ??= [
                    'serviceId'      => $sId,
                    'serviceDate'    => $sDate,
                    'serviceCreneau' => $sCre,
                    'checks'         => 0,
                    'unchecks'       => 0,
                    'lastAt'         => null,
                ];
                if ($isCheck)   $services[$sId]['checks']++;
                if ($isUncheck) $services[$sId]['unchecks']++;
                if ($occurred instanceof \DateTimeInterface) {
                    $iso = $occurred->format(\DateTimeInterface::ATOM);
                    if ($services[$sId]['lastAt'] === null || $iso > $services[$sId]['lastAt']) {
                        $services[$sId]['lastAt'] = $iso;
                    }
                }
            }
        }

        // ── Sorties ──────────────────────────────────────────────────────────

        $tauxCompletionParZone = [];
        foreach ($zones as $z) {
            $checks   = $z['checks'];
            $unchecks = $z['unchecks'];
            $total    = $checks + $unchecks;
            $tauxCompletionParZone[] = [
                'zone'     => $z['zone'],
                'couleur'  => $z['couleur'],
                'taux'     => $total > 0 ? round($checks / $total * 100, 1) : 0.0,
                'checks'   => $checks,
                'unchecks' => $unchecks,
            ];
        }
        usort($tauxCompletionParZone, static fn($a, $b) => $b['checks'] <=> $a['checks']);

        $missionsLesPlusOubliees = array_values(array_filter(
            array_map(static fn($m) => [
                'missionId'  => $m['missionId'],
                'missionNom' => $m['missionNom'],
                'zoneNom'    => $m['zoneNom'],
                'priorite'   => $m['priorite'],
                'fois'       => $m['unchecks'],
            ], $missions),
            static fn($m) => $m['fois'] > 0,
        ));
        usort($missionsLesPlusOubliees, static fn($a, $b) => $b['fois'] <=> $a['fois']);
        $missionsLesPlusOubliees = array_slice($missionsLesPlusOubliees, 0, 5);

        $rankingStaff = array_map(static function ($u) {
            $checks    = $u['checks'];
            $unchecks  = $u['unchecks'];
            $total     = $checks + $unchecks;
            return [
                'userId'        => $u['userId'],
                'userNom'       => $u['userNom'],
                'checks'        => $checks,
                'services'      => count($u['services']),
                'tauxPersonnel' => $total > 0 ? round($checks / $total * 100, 1) : 0.0,
            ];
        }, $users);
        usort($rankingStaff, static fn($a, $b) => $b['checks'] <=> $a['checks']);
        $rankingStaff = array_slice(array_values($rankingStaff), 0, 5);

        $servicesRecents = array_values($services);
        usort($servicesRecents, static function ($a, $b) {
            $la = $a['lastAt'] ?? '';
            $lb = $b['lastAt'] ?? '';
            if ($la !== $lb) return $lb <=> $la;
            $da = $a['serviceDate'] ?? '';
            $db = $b['serviceDate'] ?? '';
            if ($da !== $db) return $db <=> $da;
            return $b['serviceId'] <=> $a['serviceId'];
        });
        $servicesRecents = array_slice(array_map(static fn($s) => [
            'serviceId'      => $s['serviceId'],
            'serviceDate'    => $s['serviceDate'],
            'serviceCreneau' => $s['serviceCreneau'],
            'checks'         => $s['checks'],
            'unchecks'       => $s['unchecks'],
        ], $servicesRecents), 0, 10);

        return [
            'totalChecks'             => $totalChecks,
            'totalUnchecks'           => $totalUnchecks,
            'tauxCompletionParZone'   => $tauxCompletionParZone,
            'missionsLesPlusOubliees' => $missionsLesPlusOubliees,
            'rankingStaff'            => $rankingStaff,
            'servicesRecents'         => $servicesRecents,
        ];
    }

    /**
     * Timeline brute d'un service pour le drill-down.
     *
     * @return list<array{
     *   id:string,
     *   action:string,
     *   occurredAt:string,
     *   payload:array<string,mixed>
     * }>
     */
    public function findEventsForService(Centre $centre, int $serviceId): array
    {
        $rows = $this->createQueryBuilder('e')
            ->select('e.id AS id', 'e.action AS action', 'e.payload AS payload', 'e.occurredAt AS occurredAt')
            ->andWhere('e.centre = :c')
            ->andWhere('e.entityType = :t')
            ->setParameter('c', $centre)
            ->setParameter('t', EventLog::ENTITY_COMPLETION)
            ->orderBy('e.occurredAt', 'ASC')
            ->getQuery()
            ->getArrayResult();

        $out = [];
        foreach ($rows as $r) {
            $payload = is_array($r['payload']) ? $r['payload'] : [];
            if (($payload['serviceId'] ?? null) !== null && (int) $payload['serviceId'] === $serviceId) {
                $occurred = $r['occurredAt'] ?? null;
                $out[] = [
                    'id'         => (string) ($r['id'] ?? ''),
                    'action'     => (string) ($r['action'] ?? ''),
                    'occurredAt' => $occurred instanceof \DateTimeInterface
                        ? $occurred->format(\DateTimeInterface::ATOM)
                        : (string) $occurred,
                    'payload'    => $payload,
                ];
            }
        }

        return $out;
    }
}

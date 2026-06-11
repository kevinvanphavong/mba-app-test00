<?php

namespace App\Service;

use App\Entity\Service;
use App\Repository\MissionRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Recalcule le taux de complétion et le snapshot des missions d'un Service.
 *
 * Logique métier extraite de l'ancien CompletionListener (CLAUDE.md règle 7 :
 * pas de logique métier dans un listener). Le listener ne fait plus que déléguer
 * ici. L'UPDATE passe par DBAL (dans ce service, pas dans le listener) pour éviter
 * un second flush Doctrine ré-entrant pendant le postPersist/postRemove.
 */
final class CompletionRateCalculator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MissionRepository $missionRepo,
    ) {
    }

    /**
     * Recalcule taux_completion + missions_snapshot pour ce service et persiste
     * le résultat (UPDATE direct). Résultat identique à l'ancien listener.
     */
    public function recompute(Service $service): void
    {
        $serviceId = $service->getId();

        // Groupe les zones uniques du service
        $zonesByZoneId = [];
        foreach ($service->getPostes() as $poste) {
            $zone = $poste->getZone();
            $zonesByZoneId[$zone->getId()] = $zone;
        }

        // Compte toutes les missions du service (FIXE par zone + PONCTUELLES)
        $totalMissions = 0;
        foreach ($zonesByZoneId as $zoneId => $_) {
            $totalMissions += count($this->missionRepo->findForService($zoneId, $serviceId));
        }

        // Completions en BDD (PostRemove : déjà supprimée / PostPersist : déjà insérée)
        $completionRows = $this->em->createQuery(
            'SELECT m.id AS mId, m.texte, m.categorie, m.priorite,
                    z.id AS zId, z.nom AS zNom,
                    u.id AS uId, u.nom AS uNom, u.prenom AS uPrenom,
                    c.completedAt
             FROM App\Entity\Completion c
             JOIN c.mission m
             JOIN c.user u
             JOIN c.poste p
             JOIN p.zone z
             WHERE p.service = :svc'
        )->setParameter('svc', $service)->getArrayResult();

        $done = count(array_unique(array_column($completionRows, 'mId')));
        $taux = $totalMissions > 0 ? round($done / $totalMissions * 100, 1) : 0.0;

        // Construit le snapshot (première completion par mission = validation retenue)
        $completionByMission = [];
        foreach ($completionRows as $row) {
            $completionByMission[$row['mId']] ??= $row;
        }

        $snapshot = [];
        foreach ($zonesByZoneId as $zoneId => $zone) {
            foreach ($this->missionRepo->findForService($zoneId, $serviceId) as $mission) {
                $mId = $mission->getId();
                $c = $completionByMission[$mId] ?? null;
                $snapshot[] = [
                    'missionId' => $mId,
                    'texte' => $mission->getTexte(),
                    'categorie' => $mission->getCategorie(),
                    'priorite' => $mission->getPriorite(),
                    'zone' => $zone->getNom(),
                    'zoneId' => $zoneId,
                    'valide' => null !== $c,
                    'validePar' => $c ? ['id' => $c['uId'], 'nom' => $c['uNom'], 'prenom' => $c['uPrenom']] : null,
                    'valideA' => $c ? ($c['completedAt'] instanceof \DateTimeInterface
                        ? $c['completedAt']->format(\DateTimeInterface::ATOM)
                        : (string) $c['completedAt']) : null,
                ];
            }
        }

        $this->em->getConnection()->executeStatement(
            'UPDATE service SET taux_completion = ?, missions_snapshot = ? WHERE id = ?',
            [$taux, json_encode($snapshot, JSON_UNESCAPED_UNICODE), $serviceId]
        );
    }
}

<?php

namespace App\EventListener;

use App\Entity\Completion;
use App\Repository\MissionRepository;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Events;

/**
 * Recalcule taux_completion sur le Service après chaque cochage / décochage.
 *
 * PostPersist → mission cochée → +1 completion
 * PostRemove  → mission décochée → -1 completion
 */
#[AsEntityListener(event: Events::postPersist, entity: Completion::class, method: 'postPersist')]
#[AsEntityListener(event: Events::postRemove,  entity: Completion::class, method: 'postRemove')]
class CompletionListener
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MissionRepository $missionRepo,
    ) {}

    public function postPersist(Completion $completion): void
    {
        $this->updateTaux($completion);
    }

    public function postRemove(Completion $completion): void
    {
        $this->updateTaux($completion, removed: true);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function updateTaux(Completion $completion, bool $removed = false): void
    {
        $service = $completion->getPoste()?->getService();
        if (!$service) return;

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
                $c   = $completionByMission[$mId] ?? null;
                $snapshot[] = [
                    'missionId' => $mId,
                    'texte'     => $mission->getTexte(),
                    'categorie' => $mission->getCategorie(),
                    'priorite'  => $mission->getPriorite(),
                    'zone'      => $zone->getNom(),
                    'zoneId'    => $zoneId,
                    'valide'    => $c !== null,
                    'validePar' => $c ? ['id' => $c['uId'], 'nom' => $c['uNom'], 'prenom' => $c['uPrenom']] : null,
                    'valideA'   => $c ? ($c['completedAt'] instanceof \DateTimeInterface
                        ? $c['completedAt']->format(\DateTimeInterface::ATOM)
                        : (string) $c['completedAt']) : null,
                ];
            }
        }

        // Mise à jour directe DBAL — évite un double flush Doctrine
        $this->em->getConnection()->executeStatement(
            'UPDATE service SET taux_completion = ?, missions_snapshot = ? WHERE id = ?',
            [$taux, json_encode($snapshot, JSON_UNESCAPED_UNICODE), $serviceId]
        );
    }
}

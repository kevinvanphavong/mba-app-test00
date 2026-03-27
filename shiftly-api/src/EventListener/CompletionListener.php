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

        // Compte toutes les missions du service (FIXE par zone + PONCTUELLES)
        $totalMissions = 0;
        foreach ($service->getPostes() as $poste) {
            $missions = $this->missionRepo->findForService(
                $poste->getZone()->getId(),
                $serviceId
            );
            $totalMissions += count($missions);
        }

        // Compte les completions en BDD (déjà à jour après flush)
        $done = (int) $this->em->createQuery(
            'SELECT COUNT(c.id)
             FROM App\Entity\Completion c
             JOIN c.poste p
             WHERE p.service = :sId'
        )->setParameter('sId', $service)->getSingleScalarResult();

        // PostRemove : la completion est déjà supprimée de la BDD, done est correct
        // PostPersist : la completion vient d'être insérée, done est correct

        $taux = $totalMissions > 0 ? round($done / $totalMissions * 100, 1) : 0.0;

        // Mise à jour directe DBAL pour éviter un double flush Doctrine
        $this->em->getConnection()->executeStatement(
            'UPDATE service SET taux_completion = ? WHERE id = ?',
            [$taux, $serviceId]
        );
    }
}

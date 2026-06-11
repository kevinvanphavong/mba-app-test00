<?php

namespace App\EventListener;

use App\Entity\Completion;
use App\Entity\EventLog;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Seul écrivain d'EventLog pour Completion : alimente la table append-only
 * à chaque coche (insertion) et décoche (suppression) via le hook `onFlush`.
 *
 * `onFlush` est choisi plutôt que `postPersist` / `preRemove` car il permet
 * d'insérer une nouvelle entité EventLog DANS le même flush, sans recursion
 * ni second `flush()` manuel (computeChangeSet sur l'event nouvellement créé).
 *
 * En CLI (fixtures, commands), Security::getUser() retourne null → on retombe
 * sur Completion::getUser(), puis on tolère null (user_id = SET NULL).
 */
#[AsDoctrineListener(event: Events::onFlush)]
final class CompletionEventLogger
{
    public function __construct(private readonly Security $security)
    {
    }

    public function onFlush(OnFlushEventArgs $args): void
    {
        $em = $args->getObjectManager();
        $uow = $em->getUnitOfWork();
        $meta = $em->getClassMetadata(EventLog::class);

        // CHECK — insertions de Completion
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            if (!$entity instanceof Completion) {
                continue;
            }
            $event = $this->buildEvent($entity, EventLog::ACTION_CHECK);
            if (null === $event) {
                continue;
            }
            $em->persist($event);
            $uow->computeChangeSet($meta, $event);
        }

        // UNCHECK — suppressions de Completion
        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            if (!$entity instanceof Completion) {
                continue;
            }
            $event = $this->buildEvent($entity, EventLog::ACTION_UNCHECK);
            if (null === $event) {
                continue;
            }
            $em->persist($event);
            $uow->computeChangeSet($meta, $event);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function buildEvent(Completion $c, string $action): ?EventLog
    {
        $poste = $c->getPoste();
        $mission = $c->getMission();
        $zone = $poste?->getZone();
        $service = $poste?->getService();
        $centre = $zone?->getCentre() ?? $service?->getCentre();

        // Sans centre on n'écrit rien : centre_id NOT NULL.
        if (null === $centre) {
            return null;
        }

        $author = $this->resolveAuthor($c);

        return (new EventLog())
            ->setCentre($centre)
            ->setEntityType(EventLog::ENTITY_COMPLETION)
            ->setEntityId($c->getId())
            ->setAction($action)
            ->setUser($author)
            ->setPoste($poste)
            ->setMission($mission)
            // 8 clés exactement — cf. EVENTLOG_MODULE.md §4
            ->setPayload([
                'missionNom' => $mission?->getTexte(),
                'missionPriorite' => $mission?->getPriorite(),
                'zoneNom' => $zone?->getNom(),
                'zoneCouleur' => $zone?->getCouleur(),
                'userNom' => $this->formatUserName($author),
                'serviceId' => $service?->getId(),
                'serviceDate' => $service?->getDate()?->format('Y-m-d'),
                'serviceCreneau' => $this->resolveCreneau($service?->getHeureDebut()),
            ]);
    }

    private function resolveAuthor(Completion $c): ?User
    {
        $user = $this->security->getUser();
        if ($user instanceof User) {
            return $user;
        }

        return $c->getUser();
    }

    private function formatUserName(?User $u): ?string
    {
        if (!$u) {
            return null;
        }
        $prenom = $u->getPrenom();
        $nom = $u->getNom();
        if ($prenom && $nom) {
            return $prenom.' '.mb_strtoupper(mb_substr($nom, 0, 1)).'.';
        }

        return $nom ?? $prenom;
    }

    /** Daypart label dérivé de l'heure de début. */
    private function resolveCreneau(?\DateTimeImmutable $heureDebut): ?string
    {
        if (!$heureDebut) {
            return null;
        }
        $h = (int) $heureDebut->format('G');
        if ($h < 12) {
            return 'matin';
        }
        if ($h < 17) {
            return 'apresmidi';
        }

        return 'soir';
    }
}

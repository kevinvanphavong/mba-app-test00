<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Absence;
use App\Entity\PlanningTemplate;
use App\Entity\PlanningTemplateAbsence;
use App\Entity\PlanningTemplateShift;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\User;
use App\Repository\AbsenceRepository;
use App\Repository\PlanningTemplateRepository;
use App\Repository\PosteRepository;
use App\Service\PlanningGuardService;
use App\Service\PlanningService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Templates de planning hebdomadaires (semaine type).
 *
 *   GET    /api/planning/templates             → liste les templates du centre
 *   POST   /api/planning/templates             → crée un template depuis une semaine source
 *   DELETE /api/planning/templates/{id}        → supprime
 *   POST   /api/planning/templates/{id}/apply  → applique sur une semaine cible (mode append)
 *
 * Multi-tenancy stricte : chaque endpoint vérifie que le template appartient
 * au centre de l'utilisateur courant.
 */
#[Route('/api/planning/templates', name: 'planning_template_')]
#[IsGranted('ROLE_MANAGER')]
class PlanningTemplateController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface     $em,
        private readonly PlanningTemplateRepository $templateRepo,
        private readonly PosteRepository            $posteRepo,
        private readonly AbsenceRepository          $absenceRepo,
        private readonly PlanningGuardService       $planningGuard,
        private readonly PlanningService            $planningService,
    ) {}

    /** GET /api/planning/templates */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $centre = $this->getCurrentCentreOrFail();
        $templates = $this->templateRepo->findByCentre($centre->getId());

        return $this->json(array_map(
            fn (PlanningTemplate $t) => $this->serializeTemplate($t, includeShifts: false),
            $templates
        ));
    }

    /**
     * POST /api/planning/templates
     * Body : { "nom": "Semaine standard", "weekStart": "2026-04-20" }
     *
     * Construit le template à partir des Postes existants des Services de la
     * semaine source (lundi → dimanche).
     */
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $centre = $this->getCurrentCentreOrFail();
        /** @var User $user */
        $user = $this->getUser();

        $body = json_decode($request->getContent(), true);
        $nom       = trim((string) ($body['nom'] ?? ''));
        $weekStart = trim((string) ($body['weekStart'] ?? ''));

        if ($nom === '' || mb_strlen($nom) > 100) {
            throw new BadRequestHttpException('nom est requis (1 à 100 caractères).');
        }

        $monday = \DateTimeImmutable::createFromFormat('Y-m-d|', $weekStart);
        if (!$monday) {
            throw new BadRequestHttpException('weekStart attendu au format YYYY-MM-DD.');
        }

        $template = new PlanningTemplate();
        $template->setCentre($centre);
        $template->setNom($nom);
        $template->setCreatedBy($user);

        // Construit les shifts depuis les postes existants de la semaine source
        $weekEnd = $monday->modify('+6 days');
        $postes  = $this->posteRepo->createQueryBuilder('p')
            ->innerJoin('p.service', 's')
            ->andWhere('s.centre = :centre')
            ->andWhere('s.date BETWEEN :from AND :to')
            ->setParameter('centre', $centre)
            ->setParameter('from', $monday, Types::DATE_IMMUTABLE)
            ->setParameter('to', $weekEnd, Types::DATE_IMMUTABLE)
            ->getQuery()
            ->getResult();

        foreach ($postes as $poste) {
            /** @var Poste $poste */
            $serviceDate = $poste->getService()?->getDate();
            if (!$serviceDate) {
                continue;
            }
            $shift = new PlanningTemplateShift();
            $shift->setZone($poste->getZone());
            $shift->setUser($poste->getUser());
            $shift->setDayOfWeek(((int) $serviceDate->format('N')) - 1); // 0 = lundi
            $shift->setHeureDebut($poste->getHeureDebut());
            $shift->setHeureFin($poste->getHeureFin());
            $shift->setPauseMinutes($poste->getPauseMinutes());
            $template->addShift($shift);
        }

        // Capture également les absences (jours de repos, CP, etc.) de la semaine source
        $absences = $this->absenceRepo->findByCentreAndDateRange($centre->getId(), $monday, $weekEnd);
        foreach ($absences as $abs) {
            /** @var \App\Entity\Absence $abs */
            $absDate = $abs->getDate();
            if (!$absDate) {
                continue;
            }
            $tplAbsence = new PlanningTemplateAbsence();
            $tplAbsence->setUser($abs->getUser());
            $tplAbsence->setDayOfWeek(((int) $absDate->format('N')) - 1); // 0 = lundi
            $tplAbsence->setType($abs->getType());
            $tplAbsence->setMotif($abs->getMotif());
            $template->addAbsence($tplAbsence);
        }

        try {
            $this->em->persist($template);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Un template porte déjà ce nom dans ce centre.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json(
            $this->serializeTemplate($template, includeShifts: true),
            Response::HTTP_CREATED
        );
    }

    /** DELETE /api/planning/templates/{id} */
    #[Route('/{id<\d+>}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $template = $this->getOwnedTemplateOrFail($id);
        $this->em->remove($template);
        $this->em->flush();
        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * POST /api/planning/templates/{id}/apply
     * Body : { "weekStart": "2026-05-04" }
     *
     * Le template est la source de vérité : toutes les assignations Poste
     * existantes de la semaine cible (sur les jours non passés) sont supprimées
     * avant d'appliquer le template. Skip silencieux si :
     *   - le shift template n'a pas de user (orphelin)
     *   - la date cible est antérieure au service du jour
     *
     * Les absences gardent le mode "append + skip duplicate" (une absence
     * existante n'est pas écrasée par le template).
     */
    #[Route('/{id<\d+>}/apply', name: 'apply', methods: ['POST'])]
    public function apply(int $id, Request $request): JsonResponse
    {
        $template = $this->getOwnedTemplateOrFail($id);
        $centre   = $template->getCentre();

        $body      = json_decode($request->getContent(), true);
        $weekStart = trim((string) ($body['weekStart'] ?? ''));
        $monday    = \DateTimeImmutable::createFromFormat('Y-m-d|', $weekStart);
        if (!$monday) {
            throw new BadRequestHttpException('weekStart attendu au format YYYY-MM-DD.');
        }

        // Le template écrase les assignations existantes de la semaine cible.
        // Le passé reste protégé (clearWeek ignore les jours < service du jour).
        $replacedCount = $this->planningService->clearWeek(
            $centre,
            $monday,
            $this->planningGuard->getMinAllowedDate(),
        );

        $report = [
            'created'                 => 0,
            'skippedOrphan'           => 0,
            'skippedPast'             => 0,
            'skippedDuplicate'        => 0,
            'replacedExisting'        => $replacedCount,
            'absencesCreated'         => 0,
            'absencesSkippedOrphan'   => 0,
            'absencesSkippedPast'     => 0,
            'absencesSkippedDuplicate'=> 0,
        ];

        foreach ($template->getShifts() as $shift) {
            /** @var PlanningTemplateShift $shift */
            $user = $shift->getUser();
            if (!$user) {
                $report['skippedOrphan']++;
                continue;
            }

            $targetDate = $monday->modify('+' . $shift->getDayOfWeek() . ' days');

            try {
                $this->planningGuard->assertDateNotInPast($targetDate);
            } catch (\Throwable) {
                $report['skippedPast']++;
                continue;
            }

            $service = $this->findOrCreateService($centre, $targetDate);

            $poste = new Poste();
            $poste->setService($service);
            $poste->setZone($shift->getZone());
            $poste->setUser($user);
            $poste->setHeureDebut($shift->getHeureDebut());
            $poste->setHeureFin($shift->getHeureFin());
            $poste->setPauseMinutes($shift->getPauseMinutes());

            try {
                $this->em->persist($poste);
                $this->em->flush();
                $report['created']++;
            } catch (UniqueConstraintViolationException) {
                $report['skippedDuplicate']++;
                $this->em->clear(Poste::class);
            }
        }

        // Application des absences (jours de repos, CP, etc.)
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        foreach ($template->getAbsences() as $tplAbsence) {
            /** @var PlanningTemplateAbsence $tplAbsence */
            $user = $tplAbsence->getUser();
            if (!$user) {
                $report['absencesSkippedOrphan']++;
                continue;
            }

            $targetDate = $monday->modify('+' . $tplAbsence->getDayOfWeek() . ' days');

            try {
                $this->planningGuard->assertDateNotInPast($targetDate);
            } catch (\Throwable) {
                $report['absencesSkippedPast']++;
                continue;
            }

            $absence = new Absence();
            $absence->setCentre($centre);
            $absence->setUser($user);
            $absence->setDate($targetDate);
            $absence->setType($tplAbsence->getType());
            $absence->setMotif($tplAbsence->getMotif());
            $absence->setCreatedBy($currentUser);

            try {
                $this->em->persist($absence);
                $this->em->flush();
                $report['absencesCreated']++;
            } catch (UniqueConstraintViolationException) {
                // Une absence existe déjà ce jour-là pour cet employé → skip silencieux
                $report['absencesSkippedDuplicate']++;
                $this->em->clear(Absence::class);
            }
        }

        return $this->json($report);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function getCurrentCentreOrFail(): \App\Entity\Centre
    {
        /** @var User $u */
        $u = $this->getUser();
        $c = $u->getCentre();
        if (!$c) {
            throw $this->createAccessDeniedException('Utilisateur sans centre.');
        }
        return $c;
    }

    private function getOwnedTemplateOrFail(int $id): PlanningTemplate
    {
        $template = $this->templateRepo->find($id);
        if (!$template) {
            throw $this->createNotFoundException('Template introuvable.');
        }
        $centre = $this->getCurrentCentreOrFail();
        if ($template->getCentre()?->getId() !== $centre->getId()) {
            throw $this->createAccessDeniedException('Template hors de votre centre.');
        }
        return $template;
    }

    private function findOrCreateService(\App\Entity\Centre $centre, \DateTimeImmutable $date): Service
    {
        $existing = $this->em->getRepository(Service::class)->findOneBy([
            'centre' => $centre,
            'date'   => $date,
        ]);
        if ($existing) {
            return $existing;
        }

        $service = new Service();
        $service->setCentre($centre);
        $service->setDate($date);
        $service->setStatut('PLANIFIE');
        $this->em->persist($service);
        $this->em->flush();
        return $service;
    }

    private function serializeTemplate(PlanningTemplate $t, bool $includeShifts): array
    {
        $data = [
            'id'           => $t->getId(),
            'nom'          => $t->getNom(),
            'createdAt'    => $t->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'createdBy'    => [
                'id'  => $t->getCreatedBy()?->getId(),
                'nom' => trim(($t->getCreatedBy()?->getPrenom() ?? '') . ' ' . ($t->getCreatedBy()?->getNom() ?? '')),
            ],
            'shiftCount'   => $t->getShifts()->count(),
            'absenceCount' => $t->getAbsences()->count(),
        ];

        if ($includeShifts) {
            $data['shifts'] = array_map(
                fn (PlanningTemplateShift $s) => [
                    'id'           => $s->getId(),
                    'zoneId'       => $s->getZone()?->getId(),
                    'userId'       => $s->getUser()?->getId(),
                    'dayOfWeek'    => $s->getDayOfWeek(),
                    'heureDebut'   => $s->getHeureDebut()?->format('H:i'),
                    'heureFin'     => $s->getHeureFin()?->format('H:i'),
                    'pauseMinutes' => $s->getPauseMinutes(),
                ],
                $t->getShifts()->toArray()
            );

            $data['absences'] = array_map(
                fn (PlanningTemplateAbsence $a) => [
                    'id'        => $a->getId(),
                    'userId'    => $a->getUser()?->getId(),
                    'dayOfWeek' => $a->getDayOfWeek(),
                    'type'      => $a->getType(),
                    'motif'     => $a->getMotif(),
                ],
                $t->getAbsences()->toArray()
            );
        }

        return $data;
    }
}

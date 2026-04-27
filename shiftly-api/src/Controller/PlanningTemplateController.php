<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PlanningTemplate;
use App\Entity\PlanningTemplateShift;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\User;
use App\Repository\PlanningTemplateRepository;
use App\Repository\PosteRepository;
use App\Service\PlanningGuardService;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
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
        private readonly PlanningGuardService       $planningGuard,
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
            ->setParameter('from', $monday)
            ->setParameter('to', $weekEnd)
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
     * Mode unique : append. Ajoute des Postes aux Services de la semaine cible
     * sans toucher aux assignations existantes. Skip silencieux si :
     *   - le shift template n'a pas de user (orphelin)
     *   - la date cible est antérieure au service du jour
     *   - un Poste existe déjà pour (service, zone, user) — contrainte unique
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

        $report = ['created' => 0, 'skippedOrphan' => 0, 'skippedPast' => 0, 'skippedDuplicate' => 0];

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
            'id'         => $t->getId(),
            'nom'        => $t->getNom(),
            'createdAt'  => $t->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'createdBy'  => [
                'id'  => $t->getCreatedBy()?->getId(),
                'nom' => trim(($t->getCreatedBy()?->getPrenom() ?? '') . ' ' . ($t->getCreatedBy()?->getNom() ?? '')),
            ],
            'shiftCount' => $t->getShifts()->count(),
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
        }

        return $data;
    }
}

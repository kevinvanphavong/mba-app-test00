<?php

namespace App\Controller;

use App\Entity\Service;
use App\Entity\User;
use App\Service\PlanningGuardService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * PATCH /api/services/{id}/horaires
 *
 * Met à jour les horaires d'ouverture/fermeture d'un service existant.
 * Body : { "heureDebut": "10:00" | null, "heureFin": "22:00" | null }
 *
 * - Format attendu : H:i (ex: "10:00")
 * - null/chaîne vide → efface l'horaire
 * - Refuse l'édition d'un service antérieur au service du jour (PlanningGuard)
 */
#[IsGranted('ROLE_MANAGER')]
class UpdateServiceHoursController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanningGuardService   $planningGuard,
    ) {}

    #[Route('/api/services/{id}/horaires', name: 'api_service_update_hours', methods: ['PATCH'], format: 'json')]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $service = $this->em->find(Service::class, $id);
        if (!$service) {
            throw $this->createNotFoundException('Service introuvable.');
        }

        // Garde-fou multi-tenant
        if ($service->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à ce service.');
        }

        // Pas d'édition d'un service passé
        if ($service->getDate()) {
            $this->planningGuard->assertDateNotInPast($service->getDate());
        }

        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) {
            throw new BadRequestHttpException('Corps JSON invalide.');
        }

        if (array_key_exists('heureDebut', $body)) {
            $service->setHeureDebut($this->parseTime($body['heureDebut'], 'heureDebut'));
        }

        if (array_key_exists('heureFin', $body)) {
            $service->setHeureFin($this->parseTime($body['heureFin'], 'heureFin'));
        }

        $this->em->flush();

        return $this->json([
            'id'         => $service->getId(),
            'heureDebut' => $service->getHeureDebut()?->format('H:i'),
            'heureFin'   => $service->getHeureFin()?->format('H:i'),
        ]);
    }

    private function parseTime(mixed $value, string $field): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        $parsed = \DateTimeImmutable::createFromFormat('H:i', (string) $value);
        if (!$parsed) {
            throw new BadRequestHttpException(sprintf(
                'Format de %s invalide. Utiliser HH:MM.',
                $field
            ));
        }

        return $parsed;
    }
}

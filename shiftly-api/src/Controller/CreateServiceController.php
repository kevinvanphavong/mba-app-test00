<?php

namespace App\Controller;

use App\Entity\Centre;
use App\Entity\Service;
use App\Entity\User;
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
 * Endpoint custom pour créer un service.
 * Évite les problèmes de résolution IRI + securityPostDenormalize d'API Platform.
 *
 * POST /api/services/create
 * Body : { "date": "2026-03-27", "heureDebut": "10:00", "heureFin": "22:00" }
 * → 201 : { id, date, heureDebut, heureFin, statut, tauxCompletion }
 * → 409 : { error: "Un service existe déjà pour cette date." }
 */
#[IsGranted('ROLE_MANAGER')]
class CreateServiceController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/services/create', name: 'api_service_create_custom', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $dateStr    = trim((string) ($body['date']       ?? ''));
        $heureDebut = trim((string) ($body['heureDebut'] ?? ''));
        $heureFin   = trim((string) ($body['heureFin']   ?? ''));

        if (!$dateStr) {
            throw new BadRequestHttpException('date est requis.');
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateStr);
        if (!$date) {
            throw new BadRequestHttpException('Format de date invalide. Utiliser YYYY-MM-DD.');
        }

        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $centre      = $currentUser->getCentre();

        if (!$centre) {
            throw $this->createAccessDeniedException('Utilisateur sans centre.');
        }

        $service = new Service();
        $service->setCentre($centre);
        $service->setDate($date);

        if ($heureDebut) {
            $hd = \DateTimeImmutable::createFromFormat('H:i', $heureDebut);
            if ($hd) $service->setHeureDebut($hd);
        }
        if ($heureFin) {
            $hf = \DateTimeImmutable::createFromFormat('H:i', $heureFin);
            if ($hf) $service->setHeureFin($hf);
        }

        try {
            $this->em->persist($service);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Un service existe déjà pour cette date.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json([
            'id'             => $service->getId(),
            'date'           => $service->getDate()?->format('Y-m-d'),
            'heureDebut'     => $service->getHeureDebut()?->format('H:i'),
            'heureFin'       => $service->getHeureFin()?->format('H:i'),
            'statut'         => $service->getStatut(),
            'tauxCompletion' => $service->getTauxCompletion(),
            'note'           => $service->getNote(),
        ], Response::HTTP_CREATED);
    }
}

<?php

namespace App\Controller;

use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\Zone;
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
 * Endpoint custom pour affecter un membre à une zone pour un service.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/postes/create
 * Body : { "serviceId": 5, "zoneId": 2, "userId": 12 }
 * → { "id": 42, "user": { "id": 12, "nom": "Patou", "role": "EMPLOYE", "avatarColor": "#3b82f6" } }
 * → 409 si le membre est déjà assigné à cette zone pour ce service
 */
#[IsGranted('ROLE_MANAGER')]
class CreatePosteController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/postes/create', name: 'api_poste_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $serviceId = (int) ($body['serviceId'] ?? 0);
        $zoneId    = (int) ($body['zoneId']    ?? 0);
        $userId    = (int) ($body['userId']     ?? 0);

        if (!$serviceId || !$zoneId || !$userId) {
            throw new BadRequestHttpException('serviceId, zoneId et userId sont requis.');
        }

        $service = $this->em->find(Service::class, $serviceId);
        $zone    = $this->em->find(Zone::class,    $zoneId);
        $user    = $this->em->find(User::class,    $userId);

        if (!$service || !$zone || !$user) {
            throw $this->createNotFoundException('Service, Zone ou User introuvable.');
        }

        // Guard multi-tenant
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($zone->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cette zone.');
        }
        if ($user->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cet utilisateur.');
        }

        $poste = new Poste();
        $poste->setService($service);
        $poste->setZone($zone);
        $poste->setUser($user);

        try {
            $this->em->persist($poste);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(
                ['error' => 'Ce membre est déjà assigné à cette zone pour ce service.'],
                Response::HTTP_CONFLICT
            );
        }

        return $this->json([
            'id'   => $poste->getId(),
            'user' => [
                'id'          => $user->getId(),
                'nom'         => $user->getNom(),
                'role'        => $user->getRole(),
                'avatarColor' => $user->getAvatarColor() ?? '#6b7280',
            ],
        ], Response::HTTP_CREATED);
    }
}

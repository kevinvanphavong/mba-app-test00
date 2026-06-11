<?php

namespace App\Controller;

use App\Repository\CentreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * PATCH /api/centres/{id}/update
 * Met à jour les informations du centre (nom, adresse, téléphone, site web).
 * Réservé aux managers du centre.
 */
class UpdateCentreController extends AbstractController
{
    public function __construct(
        private readonly CentreRepository $centreRepo,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/centres/{id}/update', name: 'api_centre_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_MANAGER')]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        // Vérification multi-tenant
        if ($user->getCentre()?->getId() !== $id) {
            return $this->json(['error' => 'Accès non autorisé.'], 403);
        }

        $centre = $this->centreRepo->find($id);
        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (array_key_exists('nom', $data) && is_string($data['nom']) && '' !== trim($data['nom'])) {
            $centre->setNom(trim($data['nom']));
        }

        if (array_key_exists('adresse', $data)) {
            $centre->setAdresse(is_string($data['adresse']) && '' !== trim($data['adresse']) ? trim($data['adresse']) : null);
        }

        if (array_key_exists('telephone', $data)) {
            $centre->setTelephone(is_string($data['telephone']) && '' !== trim($data['telephone']) ? trim($data['telephone']) : null);
        }

        if (array_key_exists('siteWeb', $data)) {
            $centre->setSiteWeb(is_string($data['siteWeb']) && '' !== trim($data['siteWeb']) ? trim($data['siteWeb']) : null);
        }

        $this->em->flush();

        return $this->json([
            'id' => $centre->getId(),
            'nom' => $centre->getNom(),
            'adresse' => $centre->getAdresse(),
            'telephone' => $centre->getTelephone(),
            'siteWeb' => $centre->getSiteWeb(),
        ]);
    }
}

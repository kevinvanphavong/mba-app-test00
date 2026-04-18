<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class MeController extends AbstractController
{
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function __invoke(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $centre = $user->getCentre();

        return $this->json([
            'id'          => $user->getId(),
            'nom'         => $user->getNom(),
            'prenom'      => $user->getPrenom(),
            'email'       => $user->getEmail(),
            'role'        => $user->getRole(),
            'avatarColor' => $user->getAvatarColor(),
            'points'      => $user->getPoints(),
            'centre'      => $centre ? [
                'id'           => $centre->getId(),
                'nom'          => $centre->getNom(),
                'adresse'      => $centre->getAdresse(),
                'telephone'    => $centre->getTelephone(),
                'siteWeb'      => $centre->getSiteWeb(),
                'openingHours' => $centre->getOpeningHours(),
            ] : null,
        ]);
    }
}

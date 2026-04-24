<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminAuthController extends AbstractController
{
    #[Route('/api/superadmin/auth/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        return $this->json([
            'id'    => $user->getId(),
            'email' => $user->getUserIdentifier(),
            'nom'   => $user->getNom(),
            'role'  => $user->getRole(),
        ]);
    }

    #[Route('/api/superadmin/auth/logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // Stateless JWT — la déconnexion est gérée côté client
        return $this->json(['message' => 'Déconnecté']);
    }
}

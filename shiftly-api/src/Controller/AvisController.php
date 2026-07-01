<?php

namespace App\Controller;

use App\Core\Ia\IaGeneratorInterface;
use App\Repository\AvisRepository;
use App\Service\CurrentCentreResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Actions gérant sur les avis (hors API Platform).
 *
 * Rédaction IA d'une réponse : l'IA REMPLIT `reponse` (brouillon), mais ne publie ni
 * n'envoie rien — le gérant valide/édite puis passe le statut. Isolation par centre
 * (404 sinon). Quota atteint / IA indisponible → 429/503 propres (pas de 500).
 */
#[IsGranted('ROLE_MANAGER')]
class AvisController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly AvisRepository $avisRepo,
        private readonly IaGeneratorInterface $ia,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/avis/{id}/rediger-reponse', name: 'avis_rediger_reponse', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function redigerReponse(int $id): JsonResponse
    {
        $centre = $this->centreResolver->resolve();
        if (null === $centre) {
            throw $this->createNotFoundException();
        }

        $avis = $this->avisRepo->findOneForCentre($id, $centre);
        if (null === $avis) {
            throw $this->createNotFoundException('Avis introuvable pour ce centre.');
        }

        // Quota/indispo IA remontent en 429/503 (refus propre pour une action manuelle).
        $reponse = $this->ia->generate(
            sprintf('Avis (%d/5) : "%s". Rédige une réponse professionnelle, courtoise et brève.', $avis->getNote(), $avis->getCommentaire() ?? ''),
            ['usage' => 'avis', 'systeme' => 'Tu réponds aux avis clients avec tact.', 'maxTokens' => 400],
        );

        // Brouillon uniquement : jamais publié/envoyé automatiquement (garde humaine).
        $avis->setReponse($reponse);
        $this->em->flush();

        return $this->json(['id' => $avis->getId(), 'reponse' => $reponse, 'statut' => $avis->getStatut()]);
    }
}

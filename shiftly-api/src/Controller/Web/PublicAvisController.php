<?php

namespace App\Controller\Web;

use App\Dto\CreateAvisInput;
use App\Entity\Avis;
use App\Repository\ContactRepository;
use App\Service\CurrentCentreResolver;
use App\Service\PiiCipher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Dépôt public d'un avis post-visite sur le site d'un client (Branche 1).
 *
 * Zone publique `^/api/public` (sans auth, exemptée CSRF). Centre résolu par HOST
 * (fail-closed 404) ; l'avis lui est explicitement rattaché. Si un email connu du
 * centre est fourni, l'avis est relié au contact correspondant (dédup par hash).
 */
class PublicAvisController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly ContactRepository $contacts,
        private readonly PiiCipher $cipher,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/public/avis', name: 'public_avis_create', methods: ['POST'])]
    public function create(#[MapRequestPayload] CreateAvisInput $input): JsonResponse
    {
        $centre = $this->centreResolver->resolveByHost();
        if (null === $centre || !$centre->isActif()) {
            throw $this->createNotFoundException();
        }

        $avis = (new Avis())
            ->setCentre($centre)
            ->setNote((int) $input->note)
            ->setCommentaire(null !== $input->commentaire ? trim($input->commentaire) : null);

        // Rattachement au contact du centre si l'email est connu (via le hash, jamais en clair).
        if (null !== $input->email && '' !== trim($input->email)) {
            $contact = $this->contacts->findOneByCentreAndEmailHash($centre, $this->cipher->hashEmail($input->email));
            if (null !== $contact) {
                $avis->setContact($contact);
            }
        }

        $this->em->persist($avis);
        $this->em->flush();

        return $this->json(['id' => $avis->getId(), 'statut' => $avis->getStatut()], 201);
    }
}

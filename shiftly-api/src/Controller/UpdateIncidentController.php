<?php

namespace App\Controller;

use App\Entity\Incident;
use App\Entity\User;
use App\Entity\Zone;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * PATCH /api/incidents/{id}/update.
 *
 * Modifie un incident : titre, sévérité, statut, zone, staffImpliques.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI.
 *
 * Body (tous les champs sont optionnels) :
 * {
 *   "titre"?:    string,
 *   "severite"?: "haute"|"moyenne"|"basse",
 *   "statut"?:   "OUVERT"|"EN_COURS"|"RESOLU",
 *   "zoneId"?:   int|null,
 *   "staffIds"?: int[]
 * }
 */
#[IsGranted('ROLE_MANAGER')]
class UpdateIncidentController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/incidents/{id}/update', name: 'api_incident_update', methods: ['PATCH'], format: 'json')]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();

        $incident = $this->em->find(Incident::class, $id);
        if (!$incident) {
            throw $this->createNotFoundException('Incident introuvable.');
        }

        // Guard multi-tenant
        if ($incident->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cet incident.');
        }

        $body = json_decode($request->getContent(), true);

        if (isset($body['titre']) && '' !== trim((string) $body['titre'])) {
            $incident->setTitre(trim((string) $body['titre']));
        }

        if (isset($body['severite'])) {
            $incident->setSeverite((string) $body['severite']);
        }

        if (isset($body['statut'])) {
            $incident->setStatut((string) $body['statut']);
        }

        // Mise à jour de la zone (null = retirer la zone)
        if (array_key_exists('zoneId', $body)) {
            $zoneId = $body['zoneId'];
            if (null === $zoneId) {
                $incident->setZone(null);
            } else {
                $zone = $this->em->find(Zone::class, (int) $zoneId);
                if ($zone && $zone->getCentre()?->getId() === $currentUser->getCentre()?->getId()) {
                    $incident->setZone($zone);
                }
            }
        }

        // Remplacement complet des staffImpliqués
        if (isset($body['staffIds']) && is_array($body['staffIds'])) {
            $incident->getStaffImpliques()->clear();
            foreach (array_map('intval', $body['staffIds']) as $uid) {
                $member = $this->em->find(User::class, $uid);
                if ($member && $member->getCentre()?->getId() === $currentUser->getCentre()?->getId()) {
                    $incident->addStaffImplique($member);
                }
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $incident->getId(),
            'titre' => $incident->getTitre(),
            'severite' => $incident->getSeverite(),
            'statut' => $incident->getStatut(),
            'resolvedAt' => $incident->getResolvedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }
}

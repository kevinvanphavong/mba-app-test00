<?php

namespace App\Controller;

use App\Entity\Centre;
use App\Entity\Incident;
use App\Entity\Service;
use App\Entity\User;
use App\Entity\Zone;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint custom pour signaler un incident.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/incidents/create
 * Body : {
 *   "titre":     "Piste 3 en panne",
 *   "severite":  "haute" | "moyenne" | "basse",
 *   "centreId":  1,
 *   "serviceId": 5,
 *   "zoneId":    2,        (optionnel)
 *   "staffIds":  [3, 7]    (optionnel)
 * }
 */
#[IsGranted('ROLE_USER')]
class CreateIncidentController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/incidents/create', name: 'api_incident_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $titre     = trim((string) ($body['titre']     ?? ''));
        $severite  = (string) ($body['severite']  ?? Incident::SEV_BASSE);
        $centreId  = (int)    ($body['centreId']  ?? 0);
        $serviceId = isset($body['serviceId']) ? (int) $body['serviceId'] : null;
        $zoneId    = isset($body['zoneId'])    ? (int) $body['zoneId']    : null;
        $staffIds  = isset($body['staffIds'])  ? array_map('intval', (array) $body['staffIds']) : [];

        if (!$titre) {
            throw new BadRequestHttpException('titre est requis.');
        }
        if (!$centreId) {
            throw new BadRequestHttpException('centreId est requis.');
        }

        $centre = $this->em->find(Centre::class, $centreId);
        if (!$centre) {
            throw $this->createNotFoundException('Centre introuvable.');
        }

        // Guard multi-tenant
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($centre->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à ce centre.');
        }

        $incident = new Incident();
        $incident->setTitre($titre);
        $incident->setSeverite($severite);
        $incident->setStatut(Incident::STATUT_OUVERT);
        $incident->setCentre($centre);
        $incident->setUser($currentUser);

        if ($serviceId) {
            $service = $this->em->find(Service::class, $serviceId);
            if ($service) {
                $incident->setService($service);
            }
        }

        if ($zoneId) {
            $zone = $this->em->find(Zone::class, $zoneId);
            // Vérification multi-tenant sur la zone
            if ($zone && $zone->getCentre()?->getId() === $centreId) {
                $incident->setZone($zone);
            }
        }

        foreach ($staffIds as $uid) {
            $member = $this->em->find(User::class, $uid);
            // Vérification multi-tenant sur chaque membre
            if ($member && $member->getCentre()?->getId() === $centreId) {
                $incident->addStaffImplique($member);
            }
        }

        $this->em->persist($incident);
        $this->em->flush();

        return $this->json([
            'id'        => $incident->getId(),
            'titre'     => $incident->getTitre(),
            'severite'  => $incident->getSeverite(),
            'statut'    => $incident->getStatut(),
            'createdAt' => $incident->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], 201);
    }
}

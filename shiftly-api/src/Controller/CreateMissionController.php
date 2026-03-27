<?php

namespace App\Controller;

use App\Entity\Mission;
use App\Entity\Service;
use App\Entity\Zone;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint custom pour créer une mission.
 * Accepte des IDs entiers — évite les problèmes de résolution IRI d'API Platform.
 *
 * POST /api/missions/create
 * Body : {
 *   "texte":     "Nettoyer les tables",
 *   "categorie": "PENDANT",
 *   "frequence": "FIXE" | "PONCTUELLE",
 *   "priorite":  "vitale" | "important" | "ne_pas_oublier",
 *   "ordre":     0,
 *   "zoneId":    1,
 *   "serviceId": 5  (requis si frequence=PONCTUELLE)
 * }
 */
#[IsGranted('ROLE_MANAGER')]
class CreateMissionController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/missions/create', name: 'api_mission_create', methods: ['POST'], format: 'json')]
    public function create(Request $request): JsonResponse
    {
        $body = json_decode($request->getContent(), true);

        $texte     = trim((string) ($body['texte']     ?? ''));
        $categorie = (string) ($body['categorie'] ?? Mission::CAT_PENDANT);
        $frequence = (string) ($body['frequence'] ?? Mission::FREQ_FIXE);
        $priorite  = (string) ($body['priorite']  ?? Mission::PRIO_NE_PAS_OUBLIER);
        $ordre     = (int)    ($body['ordre']     ?? 0);
        $zoneId    = (int)    ($body['zoneId']    ?? 0);
        $serviceId = isset($body['serviceId']) ? (int) $body['serviceId'] : null;

        if (!$texte) {
            throw new BadRequestHttpException('texte est requis.');
        }
        if (!$zoneId) {
            throw new BadRequestHttpException('zoneId est requis.');
        }

        $zone = $this->em->find(Zone::class, $zoneId);
        if (!$zone) {
            throw $this->createNotFoundException('Zone introuvable.');
        }

        // Guard multi-tenant
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($zone->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé à cette zone.');
        }

        $mission = new Mission();
        $mission->setTexte($texte);
        $mission->setCategorie($categorie);
        $mission->setFrequence($frequence);
        $mission->setPriorite($priorite);
        $mission->setOrdre($ordre);
        $mission->setZone($zone);

        // Mission ponctuelle — rattachée à un service
        if ($frequence === Mission::FREQ_PONCTUELLE && $serviceId) {
            $service = $this->em->find(Service::class, $serviceId);
            if ($service) {
                $mission->setService($service);
            }
        }

        $this->em->persist($mission);
        $this->em->flush();

        return $this->json([
            'id'        => $mission->getId(),
            'texte'     => $mission->getTexte(),
            'categorie' => $mission->getCategorie(),
            'frequence' => $mission->getFrequence(),
            'priorite'  => $mission->getPriorite(),
            'ordre'     => $mission->getOrdre(),
        ], 201);
    }
}

<?php

namespace App\Controller;

use App\Repository\CentreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class CentreHorairesController extends AbstractController
{
    private const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    private const DEFAULT_HORAIRES = [
        'ouvert'     => false,
        'ouverture'  => null,
        'fermeture'  => null,
    ];

    public function __construct(
        private readonly CentreRepository       $centreRepo,
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * GET /api/centres/{id}/horaires
     * Retourne les horaires d'ouverture du centre, en garantissant les 7 jours.
     */
    #[Route('/api/centres/{id}/horaires', name: 'api_centre_horaires_get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function get(int $id): JsonResponse
    {
        $centre = $this->centreRepo->find($id);

        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable.'], 404);
        }

        return $this->json($this->normalizeHoraires($centre->getOpeningHours()));
    }

    /**
     * PUT /api/centres/{id}/horaires
     * Enregistre les horaires par jour.
     * Body attendu : { lundi: { ouvert, ouverture, fermeture }, ... }
     */
    #[Route('/api/centres/{id}/horaires', name: 'api_centre_horaires_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function update(int $id, Request $request): JsonResponse
    {
        $centre = $this->centreRepo->find($id);

        if (!$centre) {
            return $this->json(['error' => 'Centre introuvable.'], 404);
        }

        $data      = json_decode($request->getContent(), true) ?? [];
        $horaires  = [];

        foreach (self::JOURS as $jour) {
            $raw = $data[$jour] ?? [];
            $horaires[$jour] = [
                'ouvert'    => (bool) ($raw['ouvert']    ?? false),
                'ouverture' => isset($raw['ouverture'])  && $raw['ouverture'] !== '' ? $raw['ouverture']  : null,
                'fermeture' => isset($raw['fermeture'])  && $raw['fermeture'] !== '' ? $raw['fermeture']  : null,
            ];
        }

        $centre->setOpeningHours($horaires);
        $this->em->flush();

        return $this->json($horaires);
    }

    /** Garantit que les 7 jours sont toujours présents dans la réponse. */
    private function normalizeHoraires(?array $stored): array
    {
        $result = [];
        foreach (self::JOURS as $jour) {
            $result[$jour] = array_merge(self::DEFAULT_HORAIRES, $stored[$jour] ?? []);
        }
        return $result;
    }
}

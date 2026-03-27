<?php

namespace App\Controller;

use App\Entity\Competence;
use App\Entity\Mission;
use App\Entity\Zone;
use App\Repository\CompetenceRepository;
use App\Repository\MissionRepository;
use App\Repository\ZoneRepository;
use App\Repository\CentreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contrôleur dédié à l'éditeur de contenu (zones, missions, compétences).
 * Contourne le bug API Platform parse() on null sur les opérations d'écriture.
 */
#[Route('/api/editeur')]
class EditeurController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ZoneRepository         $zoneRepo,
        private readonly MissionRepository      $missionRepo,
        private readonly CompetenceRepository   $competenceRepo,
        private readonly CentreRepository       $centreRepo,
    ) {}

    // ─── ZONES ───────────────────────────────────────────────────────────────

    #[Route('/zones', name: 'editeur_zones_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listZones(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $centre = $user->getCentre();

        if (!$centre) {
            return $this->json([]);
        }

        $zones = $this->zoneRepo->findBy(['centre' => $centre], ['ordre' => 'ASC']);

        return $this->json(array_map(fn(Zone $z) => $this->serializeZone($z), $zones));
    }

    #[Route('/zones', name: 'editeur_zones_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function createZone(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $centre = $user->getCentre();
        $data   = json_decode($request->getContent(), true) ?? [];

        $zone = new Zone();
        $zone->setCentre($centre);
        $zone->setNom($data['nom'] ?? '');
        $zone->setCouleur($data['couleur'] ?? '#6366f1');
        $zone->setOrdre($data['ordre'] ?? $this->zoneRepo->count(['centre' => $centre]));

        $this->em->persist($zone);
        $this->em->flush();

        return $this->json($this->serializeZone($zone), 201);
    }

    #[Route('/zones/{id}', name: 'editeur_zones_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function updateZone(int $id, Request $request): JsonResponse
    {
        $zone = $this->zoneRepo->find($id);
        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['nom']))     $zone->setNom($data['nom']);
        if (isset($data['couleur'])) $zone->setCouleur($data['couleur']);
        if (isset($data['ordre']))   $zone->setOrdre((int) $data['ordre']);

        $this->em->flush();
        return $this->json($this->serializeZone($zone));
    }

    #[Route('/zones/{id}', name: 'editeur_zones_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function deleteZone(int $id): JsonResponse
    {
        $zone = $this->zoneRepo->find($id);
        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $this->em->remove($zone);
        $this->em->flush();
        return $this->json(null, 204);
    }

    // ─── MISSIONS ────────────────────────────────────────────────────────────

    #[Route('/zones/{id}/missions', name: 'editeur_missions_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listMissions(int $id): JsonResponse
    {
        $zone = $this->zoneRepo->find($id);
        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $missions = $this->missionRepo->findBy(['zone' => $zone], ['ordre' => 'ASC']);
        return $this->json(array_map(fn(Mission $m) => $this->serializeMission($m), $missions));
    }

    #[Route('/missions', name: 'editeur_missions_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function createMission(Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true) ?? [];
        $zoneId = (int) ($data['zoneId'] ?? 0);
        $zone   = $this->zoneRepo->find($zoneId);

        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $mission = new Mission();
        $mission->setZone($zone);
        $mission->setTexte($data['texte'] ?? '');
        $mission->setCategorie($data['categorie'] ?? Mission::CAT_PENDANT);
        $mission->setFrequence($data['frequence'] ?? Mission::FREQ_FIXE);
        $mission->setPriorite($data['priorite'] ?? Mission::PRIO_NE_PAS_OUBLIER);
        $mission->setOrdre($data['ordre'] ?? $this->missionRepo->count(['zone' => $zone]));

        $this->em->persist($mission);
        $this->em->flush();

        return $this->json($this->serializeMission($mission), 201);
    }

    #[Route('/missions/{id}', name: 'editeur_missions_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function updateMission(int $id, Request $request): JsonResponse
    {
        $mission = $this->missionRepo->find($id);
        if (!$mission) return $this->json(['error' => 'Mission introuvable.'], 404);

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['texte']))     $mission->setTexte($data['texte']);
        if (isset($data['categorie'])) $mission->setCategorie($data['categorie']);
        if (isset($data['frequence'])) $mission->setFrequence($data['frequence']);
        if (isset($data['priorite']))  $mission->setPriorite($data['priorite']);
        if (isset($data['ordre']))     $mission->setOrdre((int) $data['ordre']);

        // Déplacement vers une autre zone
        if (isset($data['zoneId'])) {
            $zone = $this->zoneRepo->find((int) $data['zoneId']);
            if ($zone) $mission->setZone($zone);
        }

        $this->em->flush();
        return $this->json($this->serializeMission($mission));
    }

    #[Route('/missions/{id}', name: 'editeur_missions_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function deleteMission(int $id): JsonResponse
    {
        $mission = $this->missionRepo->find($id);
        if (!$mission) return $this->json(['error' => 'Mission introuvable.'], 404);

        $this->em->remove($mission);
        $this->em->flush();
        return $this->json(null, 204);
    }

    // ─── COMPÉTENCES ─────────────────────────────────────────────────────────

    #[Route('/zones/{id}/competences', name: 'editeur_competences_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listCompetences(int $id): JsonResponse
    {
        $zone = $this->zoneRepo->find($id);
        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $competences = $this->competenceRepo->findBy(['zone' => $zone]);
        return $this->json(array_map(fn(Competence $c) => $this->serializeCompetence($c), $competences));
    }

    #[Route('/competences', name: 'editeur_competences_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function createCompetence(Request $request): JsonResponse
    {
        $data   = json_decode($request->getContent(), true) ?? [];
        $zoneId = (int) ($data['zoneId'] ?? 0);
        $zone   = $this->zoneRepo->find($zoneId);

        if (!$zone) return $this->json(['error' => 'Zone introuvable.'], 404);

        $competence = new Competence();
        $competence->setZone($zone);
        $competence->setNom($data['nom'] ?? '');
        $competence->setDifficulte($data['difficulte'] ?? Competence::DIFF_SIMPLE);
        $competence->setPoints((int) ($data['points'] ?? 10));
        $competence->setDescription($data['description'] ?? null);

        $this->em->persist($competence);
        $this->em->flush();

        return $this->json($this->serializeCompetence($competence), 201);
    }

    #[Route('/competences/{id}', name: 'editeur_competences_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function updateCompetence(int $id, Request $request): JsonResponse
    {
        $competence = $this->competenceRepo->find($id);
        if (!$competence) return $this->json(['error' => 'Compétence introuvable.'], 404);

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['nom']))         $competence->setNom($data['nom']);
        if (isset($data['difficulte']))  $competence->setDifficulte($data['difficulte']);
        if (isset($data['points']))      $competence->setPoints((int) $data['points']);
        if (array_key_exists('description', $data)) $competence->setDescription($data['description']);

        if (isset($data['zoneId'])) {
            $zone = $this->zoneRepo->find((int) $data['zoneId']);
            if ($zone) $competence->setZone($zone);
        }

        $this->em->flush();
        return $this->json($this->serializeCompetence($competence));
    }

    #[Route('/competences/{id}', name: 'editeur_competences_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function deleteCompetence(int $id): JsonResponse
    {
        $competence = $this->competenceRepo->find($id);
        if (!$competence) return $this->json(['error' => 'Compétence introuvable.'], 404);

        $this->em->remove($competence);
        $this->em->flush();
        return $this->json(null, 204);
    }

    // ─── Sérialiseurs internes ────────────────────────────────────────────────

    private function serializeZone(Zone $z): array
    {
        return [
            'id'             => $z->getId(),
            'nom'            => $z->getNom(),
            'couleur'        => $z->getCouleur() ?? '#6366f1',
            'ordre'          => $z->getOrdre(),
            'missionCount'   => $z->getMissions()->count(),
            'competenceCount'=> $z->getCompetences()->count(),
        ];
    }

    private function serializeMission(Mission $m): array
    {
        return [
            'id'        => $m->getId(),
            'zoneId'    => $m->getZone()?->getId(),
            'zoneName'  => $m->getZone()?->getNom(),
            'texte'     => $m->getTexte(),
            'categorie' => $m->getCategorie(),
            'frequence' => $m->getFrequence(),
            'priorite'  => $m->getPriorite(),
            'ordre'     => $m->getOrdre(),
        ];
    }

    private function serializeCompetence(Competence $c): array
    {
        return [
            'id'          => $c->getId(),
            'zoneId'      => $c->getZone()?->getId(),
            'zoneName'    => $c->getZone()?->getNom(),
            'nom'         => $c->getNom(),
            'difficulte'  => $c->getDifficulte(),
            'points'      => $c->getPoints(),
            'description' => $c->getDescription(),
        ];
    }
}

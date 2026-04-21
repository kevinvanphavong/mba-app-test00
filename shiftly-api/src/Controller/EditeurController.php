<?php

namespace App\Controller;

use App\Entity\Competence;
use App\Entity\Mission;
use App\Entity\StaffCompetence;
use App\Entity\Tutoriel;
use App\Entity\User;
use App\Entity\Zone;
use App\Repository\CompetenceRepository;
use App\Repository\MissionRepository;
use App\Repository\StaffCompetenceRepository;
use App\Repository\TutorielRepository;
use App\Repository\UserRepository;
use App\Repository\ZoneRepository;
use App\Repository\CentreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contrôleur dédié à la gestion du contenu (zones, missions, compétences).
 * Contourne le bug API Platform parse() on null sur les opérations d'écriture.
 */
#[Route('/api/editeur')]
class EditeurController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly ZoneRepository             $zoneRepo,
        private readonly MissionRepository          $missionRepo,
        private readonly CompetenceRepository       $competenceRepo,
        private readonly TutorielRepository         $tutorielRepo,
        private readonly UserRepository             $userRepo,
        private readonly StaffCompetenceRepository  $staffCompRepo,
        private readonly CentreRepository           $centreRepo,
        private readonly UserPasswordHasherInterface $hasher,
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

    // ─── TUTORIELS ───────────────────────────────────────────────────────────

    #[Route('/tutoriels', name: 'editeur_tutoriels_list', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function listTutoriels(): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $centre = $user->getCentre();

        if (!$centre) return $this->json([]);

        $tutoriels = $this->tutorielRepo->findBy(['centre' => $centre], ['createdAt' => 'DESC']);
        return $this->json(array_map(fn(Tutoriel $t) => $this->serializeTutoriel($t), $tutoriels));
    }

    #[Route('/tutoriels', name: 'editeur_tutoriels_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function createTutoriel(Request $request): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user   = $this->getUser();
        $centre = $user->getCentre();
        $data   = json_decode($request->getContent(), true) ?? [];

        $tutoriel = new Tutoriel();
        $tutoriel->setCentre($centre);
        $tutoriel->setTitre($data['titre'] ?? 'Nouveau tutoriel');
        $tutoriel->setNiveau($data['niveau'] ?? Tutoriel::NIVEAU_DEBUTANT);
        $tutoriel->setDureMin(isset($data['dureMin']) ? (int) $data['dureMin'] : null);
        $tutoriel->setContenu($data['contenu'] ?? []);

        if (!empty($data['zoneId'])) {
            $zone = $this->zoneRepo->find((int) $data['zoneId']);
            if ($zone && $zone->getCentre()?->getId() === $centre?->getId()) {
                $tutoriel->setZone($zone);
            }
        }

        $this->em->persist($tutoriel);
        $this->em->flush();
        return $this->json($this->serializeTutoriel($tutoriel), 201);
    }

    #[Route('/tutoriels/{id}', name: 'editeur_tutoriels_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function updateTutoriel(int $id, Request $request): JsonResponse
    {
        $tutoriel = $this->tutorielRepo->find($id);
        if (!$tutoriel) return $this->json(['error' => 'Tutoriel introuvable.'], 404);

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['titre']))   $tutoriel->setTitre($data['titre']);
        if (isset($data['niveau']))  $tutoriel->setNiveau($data['niveau']);
        if (isset($data['dureMin'])) $tutoriel->setDureMin($data['dureMin'] !== null ? (int) $data['dureMin'] : null);
        if (isset($data['contenu'])) $tutoriel->setContenu($data['contenu']);

        // Mise à jour de la zone (null = tutoriel général)
        if (array_key_exists('zoneId', $data)) {
            if ($data['zoneId'] === null) {
                $tutoriel->setZone(null);
            } else {
                $zone = $this->zoneRepo->find((int) $data['zoneId']);
                if ($zone) $tutoriel->setZone($zone);
            }
        }

        $this->em->flush();
        return $this->json($this->serializeTutoriel($tutoriel));
    }

    #[Route('/tutoriels/{id}', name: 'editeur_tutoriels_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function deleteTutoriel(int $id): JsonResponse
    {
        $tutoriel = $this->tutorielRepo->find($id);
        if (!$tutoriel) return $this->json(['error' => 'Tutoriel introuvable.'], 404);

        $this->em->remove($tutoriel);
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

    private function serializeTutoriel(Tutoriel $t): array
    {
        return [
            'id'        => $t->getId(),
            'titre'     => $t->getTitre(),
            'niveau'    => $t->getNiveau(),
            'dureMin'   => $t->getDureMin(),
            'contenu'   => $t->getContenu(),
            'createdAt' => $t->getCreatedAt()?->format('Y-m-d'),
            'zoneId'    => $t->getZone()?->getId(),
            'zoneName'  => $t->getZone()?->getNom(),
            'zoneCouleur' => $t->getZone()?->getCouleur(),
        ];
    }

    // ─── STAFF ───────────────────────────────────────────────────────────────

    #[Route('/staff', name: 'editeur_staff_list', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function listStaff(): JsonResponse
    {
        /** @var User $me */
        $me     = $this->getUser();
        $centre = $me->getCentre();

        if (!$centre) return $this->json([]);

        $users = $this->userRepo->findBy(['centre' => $centre], ['nom' => 'ASC']);

        return $this->json(array_map(fn(User $u) => $this->serializeUser($u), $users));
    }

    #[Route('/staff', name: 'editeur_staff_create', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function createStaff(Request $request): JsonResponse
    {
        /** @var User $me */
        $me     = $this->getUser();
        $centre = $me->getCentre();
        $data   = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json(['error' => 'Email et mot de passe requis.'], 400);
        }

        $user = new User();
        $user->setCentre($centre);
        $user->setNom($data['nom'] ?? '');
        $user->setPrenom($data['prenom'] ?? null);
        $user->setEmail($data['email']);
        $user->setRole($data['role'] ?? User::ROLE_EMPLOYE);
        $user->setTailleHaut($data['tailleHaut'] ?? null);
        $user->setTailleBas($data['tailleBas'] ?? null);
        $user->setPointure($data['pointure'] ?? null);
        $user->setActif(true);
        $user->setAvatarColor($data['avatarColor'] ?? null);
        $user->setHeuresHebdo(isset($data['heuresHebdo']) ? (int) $data['heuresHebdo'] : null);
        $user->setTypeContrat($data['typeContrat'] ?? null);
        if (array_key_exists('codePointage', $data)) $user->setCodePointage($data['codePointage'] ?: null);
        $user->setPassword($this->hasher->hashPassword($user, $data['password']));

        $this->em->persist($user);
        $this->em->flush();

        return $this->json($this->serializeUser($user), 201);
    }

    #[Route('/staff/{id}', name: 'editeur_staff_update', methods: ['PUT'])]
    #[IsGranted('ROLE_MANAGER')]
    public function updateStaff(int $id, Request $request): JsonResponse
    {
        /** @var User $me */
        $me   = $this->getUser();
        $user = $this->userRepo->find($id);

        if (!$user || $user->getCentre()?->getId() !== $me->getCentre()?->getId()) {
            return $this->json(['error' => 'Introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom']))        $user->setNom($data['nom']);
        if (array_key_exists('prenom', $data))      $user->setPrenom($data['prenom']);
        if (isset($data['email']))      $user->setEmail($data['email']);
        if (isset($data['role']))       $user->setRole($data['role']);
        if (array_key_exists('tailleHaut', $data))  $user->setTailleHaut($data['tailleHaut']);
        if (array_key_exists('tailleBas', $data))   $user->setTailleBas($data['tailleBas']);
        if (array_key_exists('pointure', $data))    $user->setPointure($data['pointure']);
        if (isset($data['actif']))      $user->setActif((bool) $data['actif']);
        if (array_key_exists('avatarColor', $data))   $user->setAvatarColor($data['avatarColor']);
        if (array_key_exists('heuresHebdo', $data))   $user->setHeuresHebdo($data['heuresHebdo'] !== null ? (int) $data['heuresHebdo'] : null);
        if (array_key_exists('typeContrat', $data))   $user->setTypeContrat($data['typeContrat'] ?: null);
        if (array_key_exists('codePointage', $data))  $user->setCodePointage($data['codePointage'] ?: null);
        if (!empty($data['password']))  $user->setPassword($this->hasher->hashPassword($user, $data['password']));

        $this->em->flush();

        return $this->json($this->serializeUser($user));
    }

    // ─── COMPÉTENCES D'UN MEMBRE ─────────────────────────────────────────────

    /**
     * GET /api/editeur/staff/{userId}/competences
     * Retourne toutes les compétences du centre avec flag acquis + staffCompetenceId.
     */
    #[Route('/staff/{userId}/competences', name: 'editeur_staff_comp_list', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function listStaffCompetences(int $userId): JsonResponse
    {
        /** @var User $me */
        $me   = $this->getUser();
        $user = $this->userRepo->find($userId);

        if (!$user || $user->getCentre()?->getId() !== $me->getCentre()?->getId()) {
            return $this->json(['error' => 'Introuvable.'], 404);
        }

        // Toutes les compétences du centre (via ses zones)
        $zones = $this->zoneRepo->findBy(['centre' => $me->getCentre()], ['ordre' => 'ASC']);

        // Index des compétences acquises par ce membre : competenceId → staffCompetenceId
        $acquises = [];
        foreach ($user->getStaffCompetences() as $sc) {
            if ($sc->getCompetence()) {
                $acquises[$sc->getCompetence()->getId()] = $sc->getId();
            }
        }

        $result = [];
        foreach ($zones as $zone) {
            $comps = $this->competenceRepo->findByZone($zone->getId());
            foreach ($comps as $comp) {
                $compId = $comp->getId();
                $result[] = [
                    'competenceId'     => $compId,
                    'nom'              => $comp->getNom(),
                    'difficulte'       => $comp->getDifficulte(),
                    'points'           => $comp->getPoints(),
                    'zoneId'           => $zone->getId(),
                    'zoneName'         => $zone->getNom(),
                    'zoneCouleur'      => $zone->getCouleur(),
                    'acquis'           => isset($acquises[$compId]),
                    'staffCompetenceId' => $acquises[$compId] ?? null,
                ];
            }
        }

        return $this->json($result);
    }

    /**
     * POST /api/editeur/staff/{userId}/competences
     * Attribue une compétence à un membre. Body: { competenceId }
     */
    #[Route('/staff/{userId}/competences', name: 'editeur_staff_comp_grant', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function grantCompetence(int $userId, Request $request): JsonResponse
    {
        /** @var User $me */
        $me   = $this->getUser();
        $user = $this->userRepo->find($userId);

        if (!$user || $user->getCentre()?->getId() !== $me->getCentre()?->getId()) {
            return $this->json(['error' => 'Introuvable.'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $comp = $this->competenceRepo->find($data['competenceId'] ?? 0);

        if (!$comp) {
            return $this->json(['error' => 'Compétence introuvable.'], 404);
        }

        // Vérifie unicité
        $existing = $this->staffCompRepo->findOneBy(['user' => $user, 'competence' => $comp]);
        if ($existing) {
            return $this->json(['staffCompetenceId' => $existing->getId(), 'points' => $user->getPoints()]);
        }

        $sc = new StaffCompetence();
        $sc->setUser($user);
        $sc->setCompetence($comp);

        $this->em->persist($sc);
        $this->em->flush(); // déclenche onAcquire → addPoints
        $this->em->flush(); // sauvegarde les points mis à jour sur User

        return $this->json([
            'staffCompetenceId' => $sc->getId(),
            'points'            => $user->getPoints(),
        ], 201);
    }

    /**
     * DELETE /api/editeur/staff/{userId}/competences/{staffCompetenceId}
     * Révoque une compétence.
     */
    #[Route('/staff/{userId}/competences/{staffCompetenceId}', name: 'editeur_staff_comp_revoke', methods: ['DELETE'])]
    #[IsGranted('ROLE_MANAGER')]
    public function revokeCompetence(int $userId, int $staffCompetenceId): JsonResponse
    {
        /** @var User $me */
        $me = $this->getUser();
        $sc = $this->staffCompRepo->find($staffCompetenceId);

        if (
            !$sc ||
            $sc->getUser()?->getId() !== $userId ||
            $sc->getUser()?->getCentre()?->getId() !== $me->getCentre()?->getId()
        ) {
            return $this->json(['error' => 'Introuvable.'], 404);
        }

        $this->em->remove($sc);
        $this->em->flush(); // déclenche onRevoke → retire les points
        $this->em->flush(); // sauvegarde les points mis à jour sur User

        return $this->json(['points' => $sc->getUser()?->getPoints() ?? 0]);
    }

    private function serializeUser(User $u): array
    {
        return [
            'id'          => $u->getId(),
            'nom'         => $u->getNom(),
            'prenom'      => $u->getPrenom(),
            'email'       => $u->getEmail(),
            'role'        => $u->getRole(),
            'points'      => $u->getPoints(),
            'actif'       => $u->isActif(),
            'tailleHaut'  => $u->getTailleHaut(),
            'tailleBas'   => $u->getTailleBas(),
            'pointure'    => $u->getPointure(),
            'avatarColor' => $u->getAvatarColor(),
            'heuresHebdo'  => $u->getHeuresHebdo(),
            'typeContrat'  => $u->getTypeContrat(),
            'codePointage' => $u->getCodePointage(),
        ];
    }
}

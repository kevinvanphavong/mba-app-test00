<?php

namespace App\Controller;

use App\Entity\Service;
use App\Repository\CompetenceRepository;
use App\Repository\PosteRepository;
use App\Repository\ServiceRepository;
use App\Repository\TutorielRepository;
use App\Repository\UserRepository;
use App\Service\ActiveDayResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoint enrichi pour la page Staff.
 * Retourne tous les membres du centre avec compétences, lectures tutos et présence.
 */
#[Route('/api/staff')]
class StaffController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface      $em,
        private readonly UserRepository             $userRepo,
        private readonly CompetenceRepository       $competenceRepo,
        private readonly TutorielRepository         $tutorielRepo,
        private readonly PosteRepository            $posteRepo,
        private readonly ServiceRepository          $serviceRepo,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly ActiveDayResolver          $activeDayResolver,
    ) {}

    // ─── Liste enrichie ───────────────────────────────────────────────────────

    #[Route('', name: 'staff_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        /** @var \App\Entity\User $me */
        $me     = $this->getUser();
        $centre = $me->getCentre();

        if (!$centre) {
            return $this->json(['members' => [], 'meta' => ['tutorielsTotal' => 0, 'competencesTotal' => 0]]);
        }

        // Membres du centre (tous, actifs ou non)
        $users = $this->userRepo->findBy(['centre' => $centre], ['nom' => 'ASC']);

        // Total compétences dans le centre (pour calcul du niveau en %)
        $competencesTotal = $this->competenceRepo->countByCentre($centre->getId());

        // Total tutoriels dans le centre
        $tutorielsTotal = $this->tutorielRepo->countByCentre($centre->getId());

        // Utilisateurs présents dans le service EN_COURS du jour
        $presentUserIds = $this->getPresentUserIds($centre->getId());

        $members = [];
        foreach ($users as $user) {
            // Compétences acquises
            $staffComps = [];
            foreach ($user->getStaffCompetences() as $sc) {
                $comp = $sc->getCompetence();
                if (!$comp) continue;
                $zone = $comp->getZone();
                $staffComps[] = [
                    'id'          => $sc->getId(),
                    'nom'         => $comp->getNom(),
                    'zoneName'    => $zone?->getNom(),
                    'zoneCouleur' => $zone?->getCouleur(),
                    'points'      => $comp->getPoints(),
                    'difficulte'  => $comp->getDifficulte(),
                ];
            }

            // Tutoriels lus
            $tutorielsLus = $user->getTutoReads()->count();

            $members[] = [
                'id'               => $user->getId(),
                'nom'              => $user->getNom(),
                'prenom'           => $user->getPrenom(),
                'email'            => $user->getEmail(),
                'role'             => $user->getRole(),
                'points'           => $user->getPoints(),
                'actif'            => $user->isActif(),
                'avatarColor'      => $user->getAvatarColor() ?? '#6b7280',
                'tailleHaut'       => $user->getTailleHaut(),
                'tailleBas'        => $user->getTailleBas(),
                'pointure'         => $user->getPointure(),
                'heuresHebdo'      => $user->getHeuresHebdo(),
                'typeContrat'      => $user->getTypeContrat(),
                'staffCompetences' => $staffComps,
                'tutorielsLus'     => $tutorielsLus,
                'isPresent'        => in_array($user->getId(), $presentUserIds, true),
            ];
        }

        return $this->json([
            'members' => $members,
            'meta'    => [
                'tutorielsTotal'   => $tutorielsTotal,
                'competencesTotal' => $competencesTotal,
            ],
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Retourne les IDs des utilisateurs affectés au service EN_COURS du jour. */
    private function getPresentUserIds(int $centreId): array
    {
        $today   = $this->activeDayResolver->getActiveDate();
        $service = $this->serviceRepo->findOneBy([
            'centre' => $centreId,
            'statut' => Service::STATUT_EN_COURS,
            'date'   => $today,
        ]);

        if (!$service) return [];

        $postes = $this->posteRepo->findBy(['service' => $service]);
        $ids    = [];
        foreach ($postes as $poste) {
            if ($poste->getUser()) {
                $ids[] = $poste->getUser()->getId();
            }
        }
        return array_unique($ids);
    }
}

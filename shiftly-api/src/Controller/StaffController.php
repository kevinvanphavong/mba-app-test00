<?php

namespace App\Controller;

use App\Entity\Service;
use App\Entity\User;
use App\Repository\CompetenceRepository;
use App\Repository\PosteRepository;
use App\Repository\ServiceRepository;
use App\Repository\TutorielRepository;
use App\Repository\UserRepository;
use App\Repository\ZoneRepository;
use App\Service\ActiveDayResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
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
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepo,
        private readonly CompetenceRepository $competenceRepo,
        private readonly TutorielRepository $tutorielRepo,
        private readonly PosteRepository $posteRepo,
        private readonly ServiceRepository $serviceRepo,
        private readonly ZoneRepository $zoneRepo,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly ActiveDayResolver $activeDayResolver,
    ) {
    }

    // ─── Liste enrichie ───────────────────────────────────────────────────────

    #[Route('', name: 'staff_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(): JsonResponse
    {
        /** @var User $me */
        $me = $this->getUser();
        $centre = $me->getCentre();
        $isManager = in_array(User::ROLE_MANAGER, $me->getRoles(), true);

        if (!$centre) {
            return $this->json([
                'members' => [],
                'meta' => $this->buildEmptyMeta(),
            ]);
        }

        $centreId = $centre->getId();

        // Membres du centre (tous, actifs ou non)
        $users = $this->userRepo->findBy(['centre' => $centre], ['nom' => 'ASC']);

        $tutorielsTotal = $this->tutorielRepo->countByCentre($centreId);
        $competencesTotal = $this->competenceRepo->countByCentre($centreId);
        $competencesParZone = $this->buildCompetencesParZone($centreId);
        $presentUserIds = $this->getPresentUserIds($centreId);

        $members = [];
        foreach ($users as $user) {
            $isSelf = $user->getId() === $me->getId();

            // Compétences acquises
            $staffComps = [];
            foreach ($user->getStaffCompetences() as $sc) {
                $comp = $sc->getCompetence();
                if (!$comp) {
                    continue;
                }
                $zone = $comp->getZone();
                $staffComps[] = [
                    'id' => $sc->getId(),
                    'competenceId' => $comp->getId(),
                    'nom' => $comp->getNom(),
                    'zoneName' => $zone?->getNom(),
                    'zoneCouleur' => $zone?->getCouleur(),
                    'points' => $comp->getPoints(),
                    'difficulte' => $comp->getDifficulte(),
                ];
            }

            // Tutoriels lus
            $tutorielsLus = $user->getTutoReads()->count();

            // Champs sensibles : exposés au manager OU sur sa propre fiche.
            $exposeContract = $isManager || $isSelf;

            $members[] = [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
                'points' => $user->getPoints(),
                'actif' => $user->isActif(),
                'avatarColor' => $user->getAvatarColor() ?? '#6b7280',
                'tailleHaut' => $user->getTailleHaut(),
                'tailleBas' => $user->getTailleBas(),
                'pointure' => $user->getPointure(),
                // Champs contrat — null pour un employé qui regarde un autre membre
                'heuresHebdo' => $exposeContract ? $user->getHeuresHebdo() : null,
                'typeContrat' => $exposeContract ? $user->getTypeContrat() : null,
                'dateEmbauche' => $exposeContract ? $user->getDateEmbauche()?->format('Y-m-d') : null,
                'codePointage' => $exposeContract ? $user->getCodePointage() : null,
                // ─── Registre du personnel — manager OU soi-même ───
                'dateNaissance' => $exposeContract ? $user->getDateNaissance()?->format('Y-m-d') : null,
                'lieuNaissanceCommune' => $exposeContract ? $user->getLieuNaissanceCommune() : null,
                'lieuNaissanceDepartement' => $exposeContract ? $user->getLieuNaissanceDepartement() : null,
                'sexe' => $exposeContract ? $user->getSexe() : null,
                'nationalite' => $exposeContract ? $user->getNationalite() : null,
                'emploi' => $exposeContract ? $user->getEmploi() : null,
                'adresse' => $exposeContract ? $user->getAdresse() : null,
                'codePostal' => $exposeContract ? $user->getCodePostal() : null,
                'ville' => $exposeContract ? $user->getVille() : null,
                'telephone' => $exposeContract ? $user->getTelephone() : null,
                // dateSortie / motifSortie : exposés à tous (ne sont pas confidentiels —
                // un employé voit qui est parti, mais ne peut pas les écrire).
                'dateSortie' => $user->getDateSortie()?->format('Y-m-d'),
                'motifSortie' => $user->getMotifSortie(),
                'staffCompetences' => $staffComps,
                'tutorielsLus' => $tutorielsLus,
                'isPresent' => in_array($user->getId(), $presentUserIds, true),
            ];
        }

        return $this->json([
            'members' => $members,
            'meta' => [
                'tutorielsTotal' => $tutorielsTotal,
                'competencesTotal' => $competencesTotal,
                'competencesParZone' => $competencesParZone,
                'competencesCatalog' => $this->buildCompetencesCatalog($centreId),
                'tenueHaut' => $centre->getTenueHaut(),
                'tenueBas' => $centre->getTenueBas(),
                'tenueChaussures' => $centre->getTenueChaussures(),
            ],
        ]);
    }

    /**
     * Liste complète des compétences du centre — sert au front pour rendre
     * les skill tags non-acquis (en gris) en plus des acquis (colorés).
     * Triée par zone puis par nom.
     */
    private function buildCompetencesCatalog(int $centreId): array
    {
        $rows = $this->em->createQuery(
            'SELECT c.id, c.nom, c.points, c.difficulte,
                    z.id AS zoneId, z.nom AS zoneName, z.couleur AS zoneCouleur, z.ordre AS zoneOrdre
             FROM App\Entity\Competence c
             JOIN c.zone z
             WHERE z.centre = :centreId
             ORDER BY z.ordre ASC, c.points DESC, c.nom ASC'
        )->setParameter('centreId', $centreId)->getArrayResult();

        return array_map(fn (array $r) => [
            'id' => (int) $r['id'],
            'nom' => $r['nom'],
            'difficulte' => $r['difficulte'],
            'points' => (int) $r['points'],
            'zoneId' => (int) $r['zoneId'],
            'zoneName' => $r['zoneName'],
            'zoneCouleur' => $r['zoneCouleur'] ?? '#6b7280',
        ], $rows);
    }

    /**
     * Retourne les totaux compétences groupés par zone du centre.
     * Format : ['Accueil' => ['total' => 5, 'couleur' => '#3b82f6'], ...].
     */
    private function buildCompetencesParZone(int $centreId): array
    {
        $rows = $this->em->createQuery(
            'SELECT z.nom AS zoneName, z.couleur AS zoneCouleur, COUNT(c.id) AS total
             FROM App\Entity\Competence c
             JOIN c.zone z
             WHERE z.centre = :centreId
             GROUP BY z.id, z.nom, z.couleur'
        )->setParameter('centreId', $centreId)->getArrayResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['zoneName']] = [
                'total' => (int) $row['total'],
                'couleur' => $row['zoneCouleur'] ?? '#6b7280',
            ];
        }

        return $result;
    }

    private function buildEmptyMeta(): array
    {
        return [
            'tutorielsTotal' => 0,
            'competencesTotal' => 0,
            'competencesParZone' => (object) [],
            'competencesCatalog' => [],
            'tenueHaut' => null,
            'tenueBas' => null,
            'tenueChaussures' => null,
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Retourne les IDs des utilisateurs affectés au service EN_COURS du jour. */
    private function getPresentUserIds(int $centreId): array
    {
        $today = $this->activeDayResolver->getActiveDate();
        $service = $this->serviceRepo->findOneBy([
            'centre' => $centreId,
            'statut' => Service::STATUT_EN_COURS,
            'date' => $today,
        ]);

        if (!$service) {
            return [];
        }

        $postes = $this->posteRepo->findBy(['service' => $service]);
        $ids = [];
        foreach ($postes as $poste) {
            if ($poste->getUser()) {
                $ids[] = $poste->getUser()->getId();
            }
        }

        return array_unique($ids);
    }
}

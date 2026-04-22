<?php

namespace App\Controller;

use App\Entity\Centre;
use App\Entity\CentreNote;
use App\Repository\CentreNoteRepository;
use App\Repository\CentreRepository;
use App\Repository\PointageRepository;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use App\Service\AuditLogService;
use App\Service\SentryApiService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminCentresController extends AbstractController
{
    public function __construct(
        private readonly CentreRepository     $centreRepo,
        private readonly UserRepository       $userRepo,
        private readonly ServiceRepository    $serviceRepo,
        private readonly CentreNoteRepository $centreNoteRepo,
        private readonly EntityManagerInterface $em,
        private readonly AuditLogService      $auditLog,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly SentryApiService     $sentryApi,
    ) {}

    #[Route('/api/superadmin/centres', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $search = $request->query->get('search', '');
        $statut = $request->query->get('statut', '');

        $qb = $this->centreRepo->createQueryBuilder('c');

        if ($search) {
            $qb->andWhere('c.nom LIKE :search OR c.adresse LIKE :search')
               ->setParameter('search', "%{$search}%");
        }

        if ($statut === 'actif') {
            $qb->andWhere('c.actif = true');
        } elseif ($statut === 'suspendu') {
            $qb->andWhere('c.actif = false');
        }

        $centres = $qb->orderBy('c.nom', 'ASC')->getQuery()->getResult();

        $data = array_map(fn(Centre $c) => [
            'id'        => $c->getId(),
            'nom'       => $c->getNom(),
            'slug'      => $c->getSlug(),
            'adresse'   => $c->getAdresse(),
            'actif'     => $c->isActif(),
            'createdAt' => $c->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'totalUsers' => $c->getUsers()->count(),
        ], $centres);

        return $this->json($data);
    }

    #[Route('/api/superadmin/centres/{id}', methods: ['GET'])]
    public function detail(int $id): JsonResponse
    {
        $centre = $this->centreRepo->find($id);
        if (!$centre) {
            return $this->json(['message' => 'Centre introuvable'], Response::HTTP_NOT_FOUND);
        }

        $users = array_map(fn($u) => [
            'id'        => $u->getId(),
            'nom'       => $u->getNom(),
            'prenom'    => $u->getPrenom(),
            'email'     => $u->getEmail(),
            'role'      => $u->getRole(),
            'actif'     => $u->isActif(),
            'createdAt' => $u->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], $centre->getUsers()->toArray());

        $notes = array_map(fn($n) => [
            'id'        => $n->getId(),
            'contenu'   => $n->getContenu(),
            'createdAt' => $n->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], $this->centreNoteRepo->findByCentre($id));

        $sentryIssues = $this->sentryApi->getIssuesByCentreId((string) $id);

        return $this->json([
            'id'          => $centre->getId(),
            'nom'         => $centre->getNom(),
            'slug'        => $centre->getSlug(),
            'adresse'     => $centre->getAdresse(),
            'telephone'   => $centre->getTelephone(),
            'siteWeb'     => $centre->getSiteWeb(),
            'actif'       => $centre->isActif(),
            'createdAt'   => $centre->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'users'       => $users,
            'notes'       => $notes,
            'sentryIssues' => $sentryIssues,
        ]);
    }

    #[Route('/api/superadmin/centres/{id}/impersonate', methods: ['POST'])]
    public function impersonate(int $id, Request $request): JsonResponse
    {
        $centre = $this->centreRepo->find($id);
        if (!$centre) {
            return $this->json(['message' => 'Centre introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Premier manager actif du centre
        $manager = $this->userRepo->findOneBy([
            'centre' => $centre,
            'role'   => 'MANAGER',
            'actif'  => true,
        ]);

        if (!$manager) {
            return $this->json(['message' => 'Aucun manager actif sur ce centre'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        /** @var \App\Entity\User $superAdmin */
        $superAdmin = $this->getUser();

        $token = $this->jwtManager->createFromPayload($manager, [
            'impersonatedBy' => $superAdmin->getId(),
            'centreId'       => $centre->getId(),
        ]);

        $this->auditLog->log(
            $superAdmin,
            'IMPERSONATE_START',
            'centre',
            $centre->getId(),
            ['managerId' => $manager->getId(), 'centreNom' => $centre->getNom()],
            $request
        );

        return $this->json([
            'token'      => $token,
            'manager'    => ['id' => $manager->getId(), 'nom' => $manager->getNom(), 'prenom' => $manager->getPrenom()],
            'centre'     => ['id' => $centre->getId(), 'nom' => $centre->getNom()],
        ]);
    }

    #[Route('/api/superadmin/centres/{id}/notes', methods: ['POST'])]
    public function addNote(int $id, Request $request): JsonResponse
    {
        $centre = $this->centreRepo->find($id);
        if (!$centre) {
            return $this->json(['message' => 'Centre introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data    = json_decode($request->getContent(), true);
        $contenu = trim($data['contenu'] ?? '');
        if (empty($contenu)) {
            return $this->json(['message' => 'Le contenu est requis'], Response::HTTP_BAD_REQUEST);
        }

        /** @var \App\Entity\User $superAdmin */
        $superAdmin = $this->getUser();

        $note = (new CentreNote())
            ->setCentre($centre)
            ->setSuperAdminUser($superAdmin)
            ->setContenu($contenu);

        $this->em->persist($note);
        $this->auditLog->log($superAdmin, 'ADD_NOTE', 'centre', $centre->getId(), ['contenu' => substr($contenu, 0, 100)], $request);

        return $this->json([
            'id'        => $note->getId(),
            'contenu'   => $note->getContenu(),
            'createdAt' => $note->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/superadmin/centres/{id}/suspend', methods: ['POST'])]
    public function suspend(int $id, Request $request): JsonResponse
    {
        return $this->toggleActif($id, false, $request);
    }

    #[Route('/api/superadmin/centres/{id}/reactivate', methods: ['POST'])]
    public function reactivate(int $id, Request $request): JsonResponse
    {
        return $this->toggleActif($id, true, $request);
    }

    private function toggleActif(int $id, bool $actif, Request $request): JsonResponse
    {
        $centre = $this->centreRepo->find($id);
        if (!$centre) {
            return $this->json(['message' => 'Centre introuvable'], Response::HTTP_NOT_FOUND);
        }

        /** @var \App\Entity\User $superAdmin */
        $superAdmin = $this->getUser();

        $centre->setActif($actif);
        $this->em->flush();

        $action = $actif ? 'CENTRE_REACTIVATE' : 'CENTRE_SUSPEND';
        $this->auditLog->log($superAdmin, $action, 'centre', $centre->getId(), ['nom' => $centre->getNom()], $request);

        return $this->json(['id' => $centre->getId(), 'actif' => $centre->isActif()]);
    }
}

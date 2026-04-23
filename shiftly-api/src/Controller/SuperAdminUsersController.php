<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AuditLogService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminUsersController extends AbstractController
{
    public function __construct(
        private readonly UserRepository               $userRepo,
        private readonly EntityManagerInterface       $em,
        private readonly AuditLogService              $auditLog,
        private readonly UserPasswordHasherInterface  $hasher,
    ) {}

    #[Route('/api/superadmin/users', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $search  = $request->query->get('search', '');
        $role    = $request->query->get('role', '');
        $centre  = $request->query->get('centre', '');
        $statut  = $request->query->get('statut', '');
        $sort    = $request->query->get('sort', 'lastLogin');

        $qb = $this->userRepo->createQueryBuilder('u')
            ->leftJoin('u.centre', 'c')->addSelect('c');

        if ($search) {
            $qb->andWhere('u.nom LIKE :s OR u.prenom LIKE :s OR u.email LIKE :s')
               ->setParameter('s', "%{$search}%");
        }
        if ($role) {
            $qb->andWhere('u.role = :r')->setParameter('r', $role);
        }
        if ($centre) {
            $qb->andWhere('c.id = :cid')->setParameter('cid', $centre);
        }
        if ($statut === 'actif') {
            $qb->andWhere('u.actif = true');
            if ($sort !== 'lastLogin') {
                $qb->andWhere('u.lastLoginAt IS NULL OR u.lastLoginAt >= :d7')
                   ->setParameter('d7', new \DateTimeImmutable('-7 days'));
            }
        } elseif ($statut === 'inactif') {
            $qb->andWhere('u.actif = false OR u.lastLoginAt < :d30')
               ->setParameter('d30', new \DateTimeImmutable('-30 days'));
        }

        match ($sort) {
            'lastLogin'  => $qb->orderBy('u.lastLoginAt', 'DESC'),
            'joinDate'   => $qb->orderBy('u.createdAt', 'DESC'),
            'name'       => $qb->orderBy('u.nom', 'ASC'),
            default      => $qb->orderBy('u.lastLoginAt', 'DESC'),
        };

        $users = $qb->getQuery()->getResult();

        $data = array_map(fn(User $u) => $this->serializeUser($u), $users);
        return $this->json($data);
    }

    #[Route('/api/superadmin/users/stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $all = $this->userRepo->findAll();
        $total     = count($all);
        $managers  = count(array_filter($all, fn(User $u) => $u->getRole() === User::ROLE_MANAGER));
        $employes  = count(array_filter($all, fn(User $u) => $u->getRole() === User::ROLE_EMPLOYE));
        $d7 = new \DateTimeImmutable('-7 days');
        $d30 = new \DateTimeImmutable('-30 days');
        $actifs7j    = count(array_filter($all, fn(User $u) => $u->getLastLoginAt() !== null && $u->getLastLoginAt() >= $d7));
        $inactifs30j = count(array_filter($all, fn(User $u) => $u->getLastLoginAt() === null || $u->getLastLoginAt() < $d30));

        return $this->json([
            'total'        => $total,
            'managers'     => $managers,
            'employes'     => $employes,
            'actifs7j'     => $actifs7j,
            'inactifs30j'  => $inactifs30j,
        ]);
    }

    #[Route('/api/superadmin/users/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function detail(int $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (!$user) {
            return $this->json(['message' => 'Utilisateur introuvable'], 404);
        }

        return $this->json([
            ...$this->serializeUser($user),
            'centreDetail' => $user->getCentre() ? [
                'id'  => $user->getCentre()->getId(),
                'nom' => $user->getCentre()->getNom(),
            ] : null,
            'codePointage' => $user->getCodePointage(),
            'heuresHebdo'  => $user->getHeuresHebdo(),
            'typeContrat'  => $user->getTypeContrat(),
        ]);
    }

    #[Route('/api/superadmin/users/{id}/reset-password', methods: ['POST'])]
    public function resetPassword(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (!$user) return $this->json(['message' => 'Utilisateur introuvable'], 404);

        $newPassword = bin2hex(random_bytes(5)); // 10 chars hex
        $user->setPassword($this->hasher->hashPassword($user, $newPassword));
        $this->em->flush();

        $this->auditLog->log($this->getUser(), 'RESET_PASSWORD', 'user', $user->getId(),
            ['email' => $user->getEmail()], $request);

        return $this->json(['newPassword' => $newPassword]);
    }

    #[Route('/api/superadmin/users/{id}/disable', methods: ['POST'])]
    public function disable(int $id, Request $request): JsonResponse
    {
        return $this->toggleActif($id, false, $request);
    }

    #[Route('/api/superadmin/users/{id}/enable', methods: ['POST'])]
    public function enable(int $id, Request $request): JsonResponse
    {
        return $this->toggleActif($id, true, $request);
    }

    private function toggleActif(int $id, bool $actif, Request $request): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (!$user) return $this->json(['message' => 'Utilisateur introuvable'], 404);

        $user->setActif($actif);
        $this->em->flush();

        $action = $actif ? 'USER_ENABLE' : 'USER_DISABLE';
        $this->auditLog->log($this->getUser(), $action, 'user', $user->getId(),
            ['email' => $user->getEmail()], $request);

        return $this->json(['id' => $user->getId(), 'actif' => $user->isActif()]);
    }

    private function serializeUser(User $u): array
    {
        return [
            'id'          => $u->getId(),
            'nom'         => $u->getNom(),
            'prenom'      => $u->getPrenom(),
            'email'       => $u->getEmail(),
            'role'        => $u->getRole(),
            'actif'       => $u->isActif(),
            'avatarColor' => $u->getAvatarColor(),
            'points'      => $u->getPoints(),
            'createdAt'   => $u->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'lastLoginAt' => $u->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
            'centre'      => $u->getCentre() ? [
                'id'  => $u->getCentre()->getId(),
                'nom' => $u->getCentre()->getNom(),
            ] : null,
        ];
    }
}

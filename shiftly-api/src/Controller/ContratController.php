<?php

namespace App\Controller;

use App\Entity\Contrat;
use App\Entity\User;
use App\Repository\ContratRepository;
use App\Repository\UserRepository;
use App\Service\ContratExtractionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Historique des contrats d'un employé (E3). Manager only, multi-tenant inline
 * (l'employé et le contrat doivent appartenir au centre du JWT).
 */
#[Route('/api', name: 'contrat_')]
#[IsGranted('ROLE_MANAGER')]
class ContratController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ContratRepository $contratRepository,
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
        private readonly ContratExtractionService $extraction,
    ) {
    }

    /** @return array<string, mixed> */
    private function serialize(Contrat $c): array
    {
        return [
            'id' => $c->getId(),
            'typeContrat' => $c->getTypeContrat(),
            'dateDebut' => $c->getDateDebut()?->format('Y-m-d'),
            'dateFin' => $c->getDateFin()?->format('Y-m-d'),
            'qualification' => $c->getQualification(),
            'heuresHebdo' => $c->getHeuresHebdo(),
            'actif' => null === $c->getDateFin(),
        ];
    }

    private function validationErrors(Contrat $c): ?JsonResponse
    {
        $violations = $this->validator->validate($c);
        if (0 === count($violations)) {
            return null;
        }
        $errors = [];
        foreach ($violations as $v) {
            $errors[$v->getPropertyPath()] = $v->getMessage();
        }

        return $this->json(['message' => 'Validation échouée', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function findUserInCentre(int $userId): ?User
    {
        /** @var User $manager */
        $manager = $this->getUser();
        $user = $this->userRepository->find($userId);
        if (!$user || $user->getCentre()?->getId() !== $manager->getCentre()?->getId()) {
            return null;
        }

        return $user;
    }

    #[Route('/users/{id}/contrats', name: 'list', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function list(int $id): JsonResponse
    {
        if (!$this->findUserInCentre($id)) {
            return $this->json(['error' => 'Employé introuvable'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(array_map(fn (Contrat $c) => $this->serialize($c), $this->contratRepository->findByUserOrdered($id)));
    }

    /**
     * Propose (via IA) un historique de contrats à partir des documents uploadés.
     * Ne persiste rien : le manager valide ensuite les propositions.
     */
    #[Route('/users/{id}/contrats/suggest-from-documents', name: 'suggest', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function suggestFromDocuments(int $id): JsonResponse
    {
        $user = $this->findUserInCentre($id);
        if (!$user) {
            return $this->json(['error' => 'Employé introuvable'], Response::HTTP_NOT_FOUND);
        }

        if (!$this->extraction->isAvailable()) {
            return $this->json(['error' => 'IA non configurée (ANTHROPIC_API_KEY absente).'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        try {
            return $this->json($this->extraction->suggest($user));
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Échec de la génération IA : '.$e->getMessage()], Response::HTTP_BAD_GATEWAY);
        }
    }

    #[Route('/users/{id}/contrats', name: 'create', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function create(int $id, Request $request): JsonResponse
    {
        $user = $this->findUserInCentre($id);
        if (!$user) {
            return $this->json(['error' => 'Employé introuvable'], Response::HTTP_NOT_FOUND);
        }

        $body = json_decode($request->getContent(), true) ?? [];
        $contrat = new Contrat();
        $contrat->setCentre($user->getCentre());
        $contrat->setUser($user);
        $this->hydrate($contrat, $body);

        if ($error = $this->validationErrors($contrat)) {
            return $error;
        }

        $this->em->persist($contrat);
        $this->em->flush();

        return $this->json($this->serialize($contrat), Response::HTTP_CREATED);
    }

    #[Route('/contrats/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $contrat = $this->findContratInCentre($id);
        if (!$contrat) {
            return $this->json(['error' => 'Contrat introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->hydrate($contrat, json_decode($request->getContent(), true) ?? []);

        if ($error = $this->validationErrors($contrat)) {
            return $error;
        }

        $this->em->flush();

        return $this->json($this->serialize($contrat));
    }

    #[Route('/contrats/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $contrat = $this->findContratInCentre($id);
        if (!$contrat) {
            return $this->json(['error' => 'Contrat introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($contrat);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    private function findContratInCentre(int $id): ?Contrat
    {
        /** @var User $manager */
        $manager = $this->getUser();
        $contrat = $this->contratRepository->find($id);
        if (!$contrat || $contrat->getCentre()?->getId() !== $manager->getCentre()?->getId()) {
            return null;
        }

        return $contrat;
    }

    /** @param array<string, mixed> $body */
    private function hydrate(Contrat $contrat, array $body): void
    {
        if (isset($body['typeContrat'])) {
            $contrat->setTypeContrat((string) $body['typeContrat']);
        }
        if (array_key_exists('dateDebut', $body)) {
            $contrat->setDateDebut($body['dateDebut'] ? new \DateTimeImmutable((string) $body['dateDebut']) : null);
        }
        if (array_key_exists('dateFin', $body)) {
            $contrat->setDateFin($body['dateFin'] ? new \DateTimeImmutable((string) $body['dateFin']) : null);
        }
        if (array_key_exists('qualification', $body)) {
            $contrat->setQualification($body['qualification'] ?: null);
        }
        if (array_key_exists('heuresHebdo', $body)) {
            $contrat->setHeuresHebdo(null !== $body['heuresHebdo'] && '' !== $body['heuresHebdo'] ? (int) $body['heuresHebdo'] : null);
        }
    }
}

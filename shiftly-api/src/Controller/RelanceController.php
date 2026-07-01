<?php

namespace App\Controller;

use App\Entity\Relance;
use App\Repository\RelanceRepository;
use App\Service\CurrentCentreResolver;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Envoi d'une relance par le GÉRANT (garde humaine) : l'IA a pu pré-rédiger le texte,
 * mais seul un humain déclenche l'envoi. L'email part via Messenger (mailer async).
 * Isolation par centre (404 sinon) ; relance déjà envoyée → 409 ; texte requis.
 */
#[IsGranted('ROLE_MANAGER')]
class RelanceController extends AbstractController
{
    public function __construct(
        private readonly CurrentCentreResolver $centreResolver,
        private readonly RelanceRepository $relances,
        private readonly MailerInterface $mailer,
        private readonly EntityManagerInterface $em,
        private readonly string $fromEmail,
    ) {
    }

    #[Route('/api/relances/{id}/envoyer', name: 'relance_envoyer', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function envoyer(int $id): JsonResponse
    {
        $centre = $this->centreResolver->resolve();
        if (null === $centre) {
            throw $this->createNotFoundException();
        }

        $relance = $this->relances->findOneForCentre($id, $centre);
        if (null === $relance) {
            throw $this->createNotFoundException('Relance introuvable pour ce centre.');
        }
        if (Relance::STATUT_ENVOYEE === $relance->getStatut()) {
            return $this->json(['message' => 'Relance déjà envoyée.'], 409);
        }
        $texte = trim((string) $relance->getTexte());
        if ('' === $texte) {
            return $this->json(['message' => 'Rédige d\'abord le texte de la relance.'], 422);
        }

        // Email de la cible : déchiffré à la volée par le type Doctrine.
        $this->mailer->send(
            (new Email())
                ->from($this->fromEmail)
                ->to((string) $relance->getContact()?->getEmail())
                ->subject('Une invitation à revenir')
                ->text($texte)
        );

        $relance->marquerEnvoyee();
        $this->em->flush();

        return $this->json(['id' => $relance->getId(), 'statut' => $relance->getStatut()]);
    }
}

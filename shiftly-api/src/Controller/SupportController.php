<?php

namespace App\Controller;

use App\Entity\SupportReply;
use App\Entity\SupportTicket;
use App\Entity\User;
use App\Repository\SupportTicketRepository;
use App\Service\FileUploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Endpoints support pour les managers/employés depuis l'app classique.
 * Les notes internes (reply.interne=true) sont FILTRÉES hors des réponses.
 */
#[IsGranted('IS_AUTHENTICATED_FULLY')]
class SupportController extends AbstractController
{
    public function __construct(
        private readonly SupportTicketRepository $ticketRepo,
        private readonly EntityManagerInterface  $em,
        private readonly FileUploadService       $uploader,
    ) {}

    #[Route('/api/support', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user->getCentre()) {
            return $this->json(['message' => 'Aucun centre associé'], 422);
        }

        $sujet    = trim($request->request->get('sujet', ''));
        $message  = trim($request->request->get('message', ''));
        $categorie= $request->request->get('categorie', SupportTicket::CATEGORIE_QUESTION);
        $priorite = $request->request->get('priorite', SupportTicket::PRIORITE_MOYENNE);

        if (!$sujet || !$message) {
            return $this->json(['message' => 'Sujet et message requis'], 400);
        }

        $ticket = (new SupportTicket())
            ->setCentre($user->getCentre())
            ->setAuteur($user)
            ->setSujet($sujet)
            ->setMessage($message)
            ->setCategorie($categorie)
            ->setPriorite($priorite);

        // Attachments
        foreach ($request->files->get('attachments', []) as $file) {
            if ($file) {
                $att = $this->uploader->uploadSupportAttachment($file, $user);
                $att->setTicket($ticket);
                $ticket->getAttachments()->add($att);
            }
        }

        $this->em->persist($ticket);
        $this->em->flush();

        return $this->json(['id' => $ticket->getId(), 'message' => 'Ticket créé'], 201);
    }

    #[Route('/api/support/mes-tickets', methods: ['GET'])]
    public function myTickets(): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $tickets = $this->ticketRepo->findByAuteur($user);

        return $this->json(array_map(fn($t) => [
            'id'           => $t->getId(),
            'sujet'        => $t->getSujet(),
            'categorie'    => $t->getCategorie(),
            'statut'       => $t->getStatut(),
            'priorite'     => $t->getPriorite(),
            'createdAt'    => $t->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt'    => $t->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'hasUnreadReply' => $this->hasUnreadReply($t, $user),
        ], $tickets));
    }

    #[Route('/api/support/mes-tickets/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function myTicketDetail(int $id): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        /** @var User $user */
        $user = $this->getUser();
        if ($ticket->getAuteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        // Marque comme vu par l'auteur
        $ticket->setLastViewedByAuthor(new \DateTimeImmutable());
        $this->em->flush();

        $replies = array_values(array_filter(
            $ticket->getReplies()->toArray(),
            fn(SupportReply $r) => !$r->isInterne()
        ));

        return $this->json([
            'id'        => $ticket->getId(),
            'sujet'     => $ticket->getSujet(),
            'message'   => $ticket->getMessage(),
            'categorie' => $ticket->getCategorie(),
            'statut'    => $ticket->getStatut(),
            'priorite'  => $ticket->getPriorite(),
            'createdAt' => $ticket->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'attachments' => array_map(fn($a) => [
                'id'       => $a->getId(),
                'filename' => $a->getFilename(),
                'url'      => '/' . $a->getStoredPath(),
                'mimeType' => $a->getMimeType(),
                'size'     => $a->getSize(),
            ], $ticket->getAttachments()->toArray()),
            'replies' => array_map(fn(SupportReply $r) => [
                'id'        => $r->getId(),
                'message'   => $r->getMessage(),
                'createdAt' => $r->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'auteur'    => [
                    'id'     => $r->getAuteur()->getId(),
                    'nom'    => $r->getAuteur()->getNom(),
                    'prenom' => $r->getAuteur()->getPrenom(),
                    'role'   => $r->getAuteur()->getRole(),
                ],
                'attachments' => array_map(fn($a) => [
                    'id'       => $a->getId(),
                    'filename' => $a->getFilename(),
                    'url'      => '/' . $a->getStoredPath(),
                    'mimeType' => $a->getMimeType(),
                    'size'     => $a->getSize(),
                ], $r->getAttachments()->toArray()),
            ], $replies),
        ]);
    }

    #[Route('/api/support/mes-tickets/{id}/reply', methods: ['POST'])]
    public function replyToMyTicket(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        /** @var User $user */
        $user = $this->getUser();
        if ($ticket->getAuteur()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé'], 403);
        }

        $message = trim($request->request->get('message', ''));
        if (!$message) return $this->json(['message' => 'Message requis'], 400);

        $reply = (new SupportReply())
            ->setTicket($ticket)
            ->setAuteur($user)
            ->setMessage($message)
            ->setInterne(false);

        foreach ($request->files->get('attachments', []) as $file) {
            if ($file) {
                $att = $this->uploader->uploadSupportAttachment($file, $user);
                $att->setReply($reply);
                $reply->getAttachments()->add($att);
            }
        }

        // Réouvre le ticket si résolu et l'auteur répond
        if ($ticket->getStatut() === SupportTicket::STATUT_RESOLU) {
            $ticket->setStatut(SupportTicket::STATUT_EN_COURS);
        }

        $this->em->persist($reply);
        $this->em->flush();

        return $this->json(['id' => $reply->getId()], 201);
    }

    #[Route('/api/support/notifications', methods: ['GET'])]
    public function notifications(): JsonResponse
    {
        /** @var User $user */
        $user    = $this->getUser();
        $tickets = $this->ticketRepo->findByAuteur($user);

        $unreadTickets = [];
        foreach ($tickets as $t) {
            if ($this->hasUnreadReply($t, $user)) {
                $unreadTickets[] = [
                    'id'      => $t->getId(),
                    'sujet'   => $t->getSujet(),
                    'statut'  => $t->getStatut(),
                ];
            }
        }

        return $this->json([
            'count'   => count($unreadTickets),
            'tickets' => array_slice($unreadTickets, 0, 5),
        ]);
    }

    private function hasUnreadReply(SupportTicket $t, User $user): bool
    {
        $lastView = $t->getLastViewedByAuthor();
        foreach ($t->getReplies() as $r) {
            if ($r->isInterne()) continue;
            if ($r->getAuteur()?->getId() === $user->getId()) continue;
            if ($lastView === null || $r->getCreatedAt() > $lastView) {
                return true;
            }
        }
        return false;
    }
}

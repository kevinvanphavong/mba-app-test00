<?php

namespace App\Controller;

use App\Entity\SupportReply;
use App\Entity\SupportTicket;
use App\Entity\User;
use App\Repository\SupportTicketRepository;
use App\Repository\UserRepository;
use App\Service\AuditLogService;
use App\Service\FileUploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminSupportController extends AbstractController
{
    public function __construct(
        private readonly SupportTicketRepository $ticketRepo,
        private readonly UserRepository          $userRepo,
        private readonly EntityManagerInterface  $em,
        private readonly AuditLogService         $auditLog,
        private readonly FileUploadService       $uploader,
    ) {}

    #[Route('/api/superadmin/support/stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        return $this->json([
            'ouverts'               => $this->ticketRepo->countByStatut(SupportTicket::STATUT_OUVERT),
            'enCours'               => $this->ticketRepo->countByStatut(SupportTicket::STATUT_EN_COURS),
            'urgents'               => $this->ticketRepo->countUrgents(),
            'resolusCetteSemaine'   => $this->ticketRepo->countResolusCetteSemaine(),
        ]);
    }

    #[Route('/api/superadmin/support', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tickets = $this->ticketRepo->findFilteredForSuperAdmin([
            'statut'    => $request->query->get('statut'),
            'priorite'  => $request->query->get('priorite'),
            'categorie' => $request->query->get('categorie'),
            'centre'    => $request->query->get('centre'),
            'search'    => $request->query->get('search'),
        ]);

        return $this->json(array_map(fn($t) => $this->serializeTicket($t, $this->getUser()), $tickets));
    }

    #[Route('/api/superadmin/support/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function detail(int $id): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        // Marque comme vu par le superadmin
        $ticket->setLastViewedBySuperAdmin(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json($this->serializeTicketDetail($ticket, true));
    }

    #[Route('/api/superadmin/support/{id}/reply', methods: ['POST'])]
    public function reply(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        $message = trim($request->request->get('message', ''));
        $interne = $request->request->getBoolean('interne', false);

        if (!$message) {
            return $this->json(['message' => 'Le message est requis'], 400);
        }

        /** @var User $superAdmin */
        $superAdmin = $this->getUser();

        $reply = (new SupportReply())
            ->setTicket($ticket)
            ->setAuteur($superAdmin)
            ->setMessage($message)
            ->setInterne($interne);

        // Attachments
        foreach ($request->files->get('attachments', []) as $file) {
            if ($file) {
                $att = $this->uploader->uploadSupportAttachment($file, $superAdmin);
                $att->setReply($reply);
                $reply->getAttachments()->add($att);
            }
        }

        // Transition statut OUVERT → EN_COURS à la 1ère réponse superadmin
        if ($ticket->getStatut() === SupportTicket::STATUT_OUVERT && !$interne) {
            $ticket->setStatut(SupportTicket::STATUT_EN_COURS);
        }

        $this->em->persist($reply);
        $this->em->flush();

        $this->auditLog->log($superAdmin, 'TICKET_REPLY', 'ticket', $ticket->getId(),
            ['interne' => $interne], $request);

        return $this->json($this->serializeReply($reply), 201);
    }

    #[Route('/api/superadmin/support/{id}/status', methods: ['PATCH'])]
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        $data   = json_decode($request->getContent(), true);
        $statut = $data['statut'] ?? '';
        if (!in_array($statut, [SupportTicket::STATUT_OUVERT, SupportTicket::STATUT_EN_COURS, SupportTicket::STATUT_RESOLU, SupportTicket::STATUT_FERME], true)) {
            return $this->json(['message' => 'Statut invalide'], 400);
        }

        $ticket->setStatut($statut);
        $this->em->flush();

        $this->auditLog->log($this->getUser(), 'TICKET_STATUS', 'ticket', $ticket->getId(),
            ['statut' => $statut], $request);

        return $this->json(['id' => $ticket->getId(), 'statut' => $statut]);
    }

    #[Route('/api/superadmin/support/{id}/priority', methods: ['PATCH'])]
    public function changePriority(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        $data     = json_decode($request->getContent(), true);
        $priorite = $data['priorite'] ?? '';
        if (!in_array($priorite, [SupportTicket::PRIORITE_BASSE, SupportTicket::PRIORITE_MOYENNE, SupportTicket::PRIORITE_HAUTE, SupportTicket::PRIORITE_URGENTE], true)) {
            return $this->json(['message' => 'Priorité invalide'], 400);
        }

        $ticket->setPriorite($priorite);
        $this->em->flush();

        $this->auditLog->log($this->getUser(), 'TICKET_PRIORITY', 'ticket', $ticket->getId(),
            ['priorite' => $priorite], $request);

        return $this->json(['id' => $ticket->getId(), 'priorite' => $priorite]);
    }

    #[Route('/api/superadmin/support/{id}/assign', methods: ['PATCH'])]
    public function assign(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->find($id);
        if (!$ticket) return $this->json(['message' => 'Ticket introuvable'], 404);

        $data       = json_decode($request->getContent(), true);
        $assigneeId = $data['assigneeId'] ?? null;

        if ($assigneeId === null) {
            $ticket->setAssigneA(null);
        } else {
            $assignee = $this->userRepo->find($assigneeId);
            if (!$assignee) return $this->json(['message' => 'Assignataire introuvable'], 404);
            $ticket->setAssigneA($assignee);
        }

        $this->em->flush();

        $this->auditLog->log($this->getUser(), 'TICKET_ASSIGN', 'ticket', $ticket->getId(),
            ['assigneeId' => $assigneeId], $request);

        return $this->json([
            'id'        => $ticket->getId(),
            'assigneA'  => $ticket->getAssigneA() ? ['id' => $ticket->getAssigneA()->getId(), 'nom' => $ticket->getAssigneA()->getNom()] : null,
        ]);
    }

    private function serializeTicket(SupportTicket $t, ?User $currentUser = null): array
    {
        $unreadForSA = false;
        if ($currentUser) {
            $lastView = $t->getLastViewedBySuperAdmin();
            $lastReply = $t->getReplies()->last() ?: null;
            $candidate = $lastReply ? $lastReply->getCreatedAt() : $t->getCreatedAt();
            $unreadForSA = $lastView === null || ($candidate && $candidate > $lastView);
        }

        return [
            'id'        => $t->getId(),
            'sujet'     => $t->getSujet(),
            'extrait'   => mb_substr($t->getMessage(), 0, 120),
            'categorie' => $t->getCategorie(),
            'statut'    => $t->getStatut(),
            'priorite'  => $t->getPriorite(),
            'centre'    => $t->getCentre() ? ['id' => $t->getCentre()->getId(), 'nom' => $t->getCentre()->getNom()] : null,
            'auteur'    => [
                'id'     => $t->getAuteur()->getId(),
                'nom'    => $t->getAuteur()->getNom(),
                'prenom' => $t->getAuteur()->getPrenom(),
                'email'  => $t->getAuteur()->getEmail(),
            ],
            'assigneA'  => $t->getAssigneA() ? ['id' => $t->getAssigneA()->getId(), 'nom' => $t->getAssigneA()->getNom()] : null,
            'createdAt' => $t->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $t->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'lastActivity' => $t->getUpdatedAt()?->format(\DateTimeInterface::ATOM) ?? $t->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'repliesCount' => $t->getReplies()->count(),
            'unread'       => $unreadForSA,
        ];
    }

    private function serializeReply(SupportReply $r): array
    {
        return [
            'id'        => $r->getId(),
            'message'   => $r->getMessage(),
            'interne'   => $r->isInterne(),
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
        ];
    }

    private function serializeTicketDetail(SupportTicket $t, bool $includeInterne): array
    {
        $replies = $t->getReplies()->filter(fn(SupportReply $r) => $includeInterne || !$r->isInterne());

        return [
            ...$this->serializeTicket($t),
            'message'     => $t->getMessage(),
            'attachments' => array_map(fn($a) => [
                'id'       => $a->getId(),
                'filename' => $a->getFilename(),
                'url'      => '/' . $a->getStoredPath(),
                'mimeType' => $a->getMimeType(),
                'size'     => $a->getSize(),
            ], $t->getAttachments()->toArray()),
            'replies' => array_map(fn(SupportReply $r) => $this->serializeReply($r), $replies->toArray()),
        ];
    }
}

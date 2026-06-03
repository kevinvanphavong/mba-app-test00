<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Entity\User;
use App\Repository\LeadRepository;
use App\Security\Voter\LeadVoter;
use App\Service\AuditLogService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminLeadController extends AbstractController
{
    public function __construct(
        private readonly LeadRepository          $leadRepo,
        private readonly EntityManagerInterface  $em,
        private readonly AuditLogService         $auditLog,
    ) {}

    #[Route('/api/superadmin/leads/stats', methods: ['GET'])]
    public function stats(): JsonResponse
    {
        $monthStart = new \DateTimeImmutable('first day of this month 00:00:00');
        $oldThreshold = new \DateTimeImmutable('-48 hours');

        $activeProspects = $this->leadRepo->findActiveProspects();
        $mrrPotentiel = 0;
        foreach ($activeProspects as $l) {
            $mrrPotentiel += self::planMonthlyValue($l->getPlan());
        }

        $totalThisMonth = $this->leadRepo->countCreatedSince($monthStart);
        $converted = $this->leadRepo->countByStatus(Lead::STATUS_CONVERTI);
        $totalAll = $this->em->createQuery('SELECT COUNT(l.id) FROM App\\Entity\\Lead l')->getSingleScalarResult();
        $tauxConversion = $totalAll > 0 ? round(($converted / (int)$totalAll) * 100) : 0;

        return $this->json([
            'nouveaux'             => $this->leadRepo->countByStatus(Lead::STATUS_NOUVEAU),
            'nouveauxCeMois'       => $totalThisMonth,
            'tauxConversion'       => $tauxConversion,
            'leadsNonTraitesVieux' => $this->leadRepo->countUnhandledOlderThan($oldThreshold),
            'mrrPotentielEur'      => $mrrPotentiel,
        ]);
    }

    #[Route('/api/superadmin/leads', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted(LeadVoter::VIEW);

        $page = max(1, (int) $request->query->get('page', '1'));
        $perPage = 30;

        $result = $this->leadRepo->findFilteredForSuperAdmin([
            'status' => $request->query->get('status'),
            'intent' => $request->query->get('intent'),
            'plan'   => $request->query->get('plan'),
            'q'      => $request->query->get('q'),
        ], $page, $perPage);

        return $this->json([
            'items'      => array_map([$this, 'serializeSummary'], $result['items']),
            'total'      => $result['total'],
            'page'       => $page,
            'perPage'    => $perPage,
            'totalPages' => max(1, (int) ceil($result['total'] / $perPage)),
        ]);
    }

    #[Route('/api/superadmin/leads/{id}', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function detail(int $id): JsonResponse
    {
        $lead = $this->leadRepo->find($id);
        if (!$lead) return $this->json(['message' => 'Lead introuvable'], 404);

        $this->denyAccessUnlessGranted(LeadVoter::VIEW, $lead);

        return $this->json($this->serializeDetail($lead));
    }

    #[Route('/api/superadmin/leads/{id}', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $lead = $this->leadRepo->find($id);
        if (!$lead) return $this->json(['message' => 'Lead introuvable'], 404);

        $this->denyAccessUnlessGranted(LeadVoter::EDIT, $lead);

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Payload JSON invalide.'], 400);
        }

        /** @var User $currentUser */
        $currentUser = $this->getUser();

        if (isset($data['status'])) {
            $newStatus = (string) $data['status'];
            if (!in_array($newStatus, [
                Lead::STATUS_NOUVEAU, Lead::STATUS_CONTACTE, Lead::STATUS_QUALIFIE,
                Lead::STATUS_CONVERTI, Lead::STATUS_PERDU,
            ], true)) {
                return $this->json(['message' => 'Status invalide.'], 400);
            }
            $previous = $lead->getStatus();
            $lead->setStatus($newStatus);

            // Premier passage hors "nouveau" → on horodate handledBy/handledAt
            if ($previous === Lead::STATUS_NOUVEAU && $newStatus !== Lead::STATUS_NOUVEAU && $lead->getHandledBy() === null) {
                $lead->setHandledBy($currentUser);
                $lead->setHandledAt(new \DateTimeImmutable());
            }

            $this->auditLog->log($currentUser, 'LEAD_STATUS', 'lead', $lead->getId(), ['status' => $newStatus], $request);
        }

        if (array_key_exists('notes', $data)) {
            $notes = $data['notes'];
            $lead->setNotes($notes === null ? null : mb_substr((string)$notes, 0, 20000));
            $this->auditLog->log($currentUser, 'LEAD_NOTES', 'lead', $lead->getId(), [], $request);
        }

        $this->em->flush();

        return $this->json($this->serializeDetail($lead));
    }

    /** @return array<string,mixed> */
    private function serializeSummary(Lead $l): array
    {
        return [
            'id'        => $l->getId(),
            'intent'    => $l->getIntent(),
            'plan'      => $l->getPlan(),
            'name'      => $l->getName(),
            'email'     => $l->getEmail(),
            'phone'     => $l->getPhone(),
            'centre'    => $l->getCentre(),
            'city'      => $l->getCity(),
            'zip'       => $l->getZip(),
            'activity'  => $l->getActivity(),
            'status'    => $l->getStatus(),
            'createdAt' => $l->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'handledBy' => $l->getHandledBy() ? [
                'id'    => $l->getHandledBy()->getId(),
                'nom'   => $l->getHandledBy()->getNom(),
                'prenom'=> $l->getHandledBy()->getPrenom(),
            ] : null,
            'handledAt' => $l->getHandledAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /** @return array<string,mixed> */
    private function serializeDetail(Lead $l): array
    {
        return [
            ...$this->serializeSummary($l),
            'staffSize'      => $l->getStaffSize(),
            'preferredSlot'  => $l->getPreferredSlot(),
            'channel'        => $l->getChannel(),
            'customNeeds'    => $l->getCustomNeeds(),
            'message'        => $l->getMessage(),
            'consent'        => $l->getConsent(),
            'consentAt'      => $l->getConsentAt()?->format(\DateTimeInterface::ATOM),
            'source'         => $l->getSource(),
            'notes'          => $l->getNotes(),
            'updatedAt'      => $l->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /** Valeur mensuelle approximative (en €/mois) utilisée pour le KPI "MRR potentiel". */
    private static function planMonthlyValue(string $plan): int
    {
        return match ($plan) {
            Lead::PLAN_STARTER => 49,
            Lead::PLAN_PRO     => 99,
            Lead::PLAN_PREMIUM => 199,
            default            => 0,
        };
    }
}

<?php

namespace App\Controller;

use App\Entity\Lead;
use App\Event\LeadCreatedEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

/**
 * Endpoint public de capture des leads depuis la landing shiftly.fr.
 * Aucune authentification requise — la route est whitelistée dans security.yaml.
 * Anti-flood : rate limiter framework (sliding window 5/h par IP).
 */
class LeadController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ValidatorInterface $validator,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly RateLimiterFactory $leadCreationLimiter,
    ) {
    }

    #[Route('/api/leads', name: 'lead_create_public', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Anti-flood : rate limiter framework, clé = IP cliente.
        if (!$this->leadCreationLimiter->create($request->getClientIp())->consume(1)->isAccepted()) {
            return $this->json([
                'message' => 'Trop de demandes envoyées. Réessaie dans un moment.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Payload JSON invalide.'], 400);
        }

        $email = strtolower(trim((string) ($data['email'] ?? '')));

        $intent = $this->normalize($data['intent'] ?? null, [Lead::INTENT_TRIAL, Lead::INTENT_DEMO, Lead::INTENT_CUSTOM], Lead::INTENT_TRIAL);
        $plan = $this->normalize($data['plan'] ?? null, [Lead::PLAN_STARTER, Lead::PLAN_PRO, Lead::PLAN_PREMIUM, Lead::PLAN_UNDECIDED], Lead::PLAN_UNDECIDED);
        $channel = isset($data['channel']) ? $this->normalize($data['channel'], [Lead::CHANNEL_MEET, Lead::CHANNEL_ZOOM, Lead::CHANNEL_TEAMS, Lead::CHANNEL_PHONE], null) : null;
        $activity = $this->normalize($data['activity'] ?? null, [
            Lead::ACTIVITY_BOWLING, Lead::ACTIVITY_LASER, Lead::ACTIVITY_ARCADE,
            Lead::ACTIVITY_KARAOKE, Lead::ACTIVITY_VR, Lead::ACTIVITY_MIXTE, Lead::ACTIVITY_AUTRE,
        ], Lead::ACTIVITY_AUTRE);

        $lead = new Lead();
        $lead
            ->setIntent($intent)
            ->setPlan($plan)
            ->setName(mb_substr(trim((string) ($data['name'] ?? '')), 0, 120))
            ->setEmail(mb_substr($email, 0, 180))
            ->setPhone(mb_substr(trim((string) ($data['phone'] ?? '')), 0, 30))
            ->setCentre(mb_substr(trim((string) ($data['centre'] ?? '')), 0, 180))
            ->setActivity($activity)
            ->setStaffSize(mb_substr(trim((string) ($data['staffSize'] ?? '')), 0, 20))
            ->setCity($this->nullableString($data['city'] ?? null, 120))
            ->setZip($this->nullableString($data['zip'] ?? null, 10))
            ->setPreferredSlot($this->nullableString($data['preferredSlot'] ?? null, 500))
            ->setChannel($channel)
            ->setCustomNeeds($this->nullableString($data['customNeeds'] ?? null, 5000))
            ->setMessage($this->nullableString($data['message'] ?? null, 5000))
            ->setConsent((bool) ($data['consent'] ?? false))
            ->setConsentAt(new \DateTimeImmutable())
            ->setSource(mb_substr(trim((string) ($data['source'] ?? 'inconnu')), 0, 80))
            ->setStatus(Lead::STATUS_NOUVEAU);

        // Validation Symfony (constraints Collection sur un sous-ensemble normalisé)
        $payload = [
            'name' => $lead->getName(),
            'email' => $lead->getEmail(),
            'phone' => $lead->getPhone(),
            'centre' => $lead->getCentre(),
            'consent' => $lead->getConsent(),
        ];
        $violations = $this->validator->validate($payload, $this->buildConstraint());
        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $v) {
                $errors[trim($v->getPropertyPath(), '[]')] = $v->getMessage();
            }

            return $this->json(['message' => 'Validation échouée', 'errors' => $errors], 422);
        }

        $this->em->persist($lead);
        $this->em->flush();

        // Notification email Gmail — async-like via event dispatcher
        $this->dispatcher->dispatch(new LeadCreatedEvent($lead));

        return $this->json([
            'id' => $lead->getId(),
            'status' => $lead->getStatus(),
            'createdAt' => $lead->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], 201);
    }

    private function nullableString(mixed $value, int $maxLen): ?string
    {
        if (null === $value || '' === $value) {
            return null;
        }

        return mb_substr(trim((string) $value), 0, $maxLen);
    }

    /**
     * @param array<int, string> $allowed
     */
    private function normalize(mixed $value, array $allowed, ?string $default): ?string
    {
        $v = is_string($value) ? strtolower(trim($value)) : '';

        return in_array($v, $allowed, true) ? $v : $default;
    }

    private function buildConstraint(): Assert\Collection
    {
        // Valide un sous-ensemble normalisé extrait du Lead — plus simple que d'ajouter
        // des #[Assert] sur l'entité (qui est partagée avec le back-office).
        return new Assert\Collection(
            fields: [
                'name' => [new Assert\NotBlank(message: 'Le nom est requis.'), new Assert\Length(max: 120)],
                'email' => [new Assert\NotBlank(message: 'L\'email est requis.'), new Assert\Email(message: 'Email invalide.')],
                'phone' => [new Assert\NotBlank(message: 'Le téléphone est requis.'), new Assert\Length(max: 30)],
                'centre' => [new Assert\NotBlank(message: 'Le nom du centre est requis.'), new Assert\Length(max: 180)],
                'consent' => [new Assert\IsTrue(message: 'Le consentement RGPD est obligatoire.')],
            ],
            allowExtraFields: true,
            allowMissingFields: true,
        );
    }
}

<?php

namespace App\Service;

use App\Entity\User;
use App\Message\LogAuditEventMessage;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\MessageBusInterface;

class AuditLogService
{
    public function __construct(private MessageBusInterface $bus)
    {
    }

    /**
     * Journalise une action sensible. Effet de bord asynchrone (Messenger) :
     * la persistance de l'AuditLog ne bloque ni ne casse la requête courante.
     *
     * @param array<string, mixed> $metadata
     */
    public function log(
        User $superAdmin,
        string $action,
        string $targetType,
        ?int $targetId,
        array $metadata,
        Request $request,
    ): void {
        $this->bus->dispatch(new LogAuditEventMessage(
            superAdminUserId: $superAdmin->getId(),
            action: $action,
            targetType: $targetType,
            targetId: $targetId,
            metadata: $metadata,
            ip: $request->getClientIp(),
            userAgent: $request->headers->get('User-Agent'),
        ));
    }
}

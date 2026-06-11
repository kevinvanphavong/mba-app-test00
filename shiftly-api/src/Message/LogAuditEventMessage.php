<?php

namespace App\Message;

/**
 * Journalisation asynchrone d'une action sensible (audit log superadmin).
 * Ne transporte que des scalaires (sérialisable par Messenger).
 */
final class LogAuditEventMessage
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly int $superAdminUserId,
        public readonly string $action,
        public readonly string $targetType,
        public readonly ?int $targetId,
        public readonly array $metadata,
        public readonly ?string $ip,
        public readonly ?string $userAgent,
    ) {
    }
}

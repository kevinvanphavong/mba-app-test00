<?php

namespace App\MessageHandler;

use App\Message\CleanupR2ObjectMessage;
use App\Service\R2StorageService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Supprime le binaire R2. Si R2 échoue, l'exception remonte → Messenger retente
 * (retry 3x) puis route le message vers le transport `failed` pour rejeu manuel.
 */
#[AsMessageHandler]
final class CleanupR2ObjectHandler
{
    public function __construct(private readonly R2StorageService $r2)
    {
    }

    public function __invoke(CleanupR2ObjectMessage $message): void
    {
        if ('' === $message->storageKey) {
            return;
        }

        $this->r2->delete($message->storageKey);
    }
}

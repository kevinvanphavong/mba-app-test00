<?php

namespace App\MessageHandler;

use App\Entity\AuditLog;
use App\Message\LogAuditEventMessage;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class LogAuditEventHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepo,
    ) {
    }

    public function __invoke(LogAuditEventMessage $message): void
    {
        $superAdmin = $this->userRepo->find($message->superAdminUserId);
        if (null === $superAdmin) {
            return; // user supprimé entre-temps : on ne journalise pas un orphelin
        }

        $log = (new AuditLog())
            ->setSuperAdminUser($superAdmin)
            ->setAction($message->action)
            ->setTargetType($message->targetType)
            ->setTargetId($message->targetId)
            ->setMetadata($message->metadata ?: null)
            ->setIp($message->ip)
            ->setUserAgent($message->userAgent);

        $this->em->persist($log);
        $this->em->flush();
    }
}

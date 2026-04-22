<?php

namespace App\Service;

use App\Entity\AuditLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

class AuditLogService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function log(
        User    $superAdmin,
        string  $action,
        string  $targetType,
        ?int    $targetId,
        array   $metadata,
        Request $request
    ): void {
        $log = (new AuditLog())
            ->setSuperAdminUser($superAdmin)
            ->setAction($action)
            ->setTargetType($targetType)
            ->setTargetId($targetId)
            ->setMetadata($metadata ?: null)
            ->setIp($request->getClientIp())
            ->setUserAgent($request->headers->get('User-Agent'));

        $this->em->persist($log);
        $this->em->flush();
    }
}

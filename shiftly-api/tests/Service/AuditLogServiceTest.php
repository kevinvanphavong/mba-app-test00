<?php

namespace App\Tests\Service;

use App\Entity\User;
use App\Message\LogAuditEventMessage;
use App\Service\AuditLogService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\MessageBusInterface;

class AuditLogServiceTest extends TestCase
{
    public function testLogDispatcheUnMessageAsynchroneAvecLesBonnesDonnees(): void
    {
        $superAdmin = $this->createStub(User::class);
        $superAdmin->method('getId')->willReturn(42);

        $captured = null;
        $bus = $this->createMock(MessageBusInterface::class);
        $bus->expects($this->once())
            ->method('dispatch')
            ->willReturnCallback(function (object $message) use (&$captured): Envelope {
                $captured = $message;

                return new Envelope($message);
            });

        $request = Request::create('/api/superadmin/x', 'POST', server: [
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_USER_AGENT' => 'PHPUnit',
        ]);

        (new AuditLogService($bus))->log(
            $superAdmin,
            'IMPERSONATE_START',
            'centre',
            7,
            ['centreNom' => 'Test'],
            $request,
        );

        $this->assertInstanceOf(LogAuditEventMessage::class, $captured);
        $this->assertSame(42, $captured->superAdminUserId);
        $this->assertSame('IMPERSONATE_START', $captured->action);
        $this->assertSame('centre', $captured->targetType);
        $this->assertSame(7, $captured->targetId);
        $this->assertSame(['centreNom' => 'Test'], $captured->metadata);
        $this->assertSame('10.0.0.1', $captured->ip);
        $this->assertSame('PHPUnit', $captured->userAgent);
    }
}

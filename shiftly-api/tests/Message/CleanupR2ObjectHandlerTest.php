<?php

namespace App\Tests\Message;

use App\Message\CleanupR2ObjectMessage;
use App\MessageHandler\CleanupR2ObjectHandler;
use App\Service\R2StorageService;
use PHPUnit\Framework\TestCase;

class CleanupR2ObjectHandlerTest extends TestCase
{
    public function testSupprimeLeBinaireR2(): void
    {
        $r2 = $this->createMock(R2StorageService::class);
        $r2->expects($this->once())->method('delete')->with('medias/abc.jpg');

        (new CleanupR2ObjectHandler($r2))(new CleanupR2ObjectMessage('medias/abc.jpg'));
    }

    public function testCleNeFaitRien(): void
    {
        $r2 = $this->createMock(R2StorageService::class);
        $r2->expects($this->never())->method('delete');

        (new CleanupR2ObjectHandler($r2))(new CleanupR2ObjectMessage(''));
    }

    public function testLExceptionR2RemonteePourLeRetryMessenger(): void
    {
        $r2 = $this->createStub(R2StorageService::class);
        $r2->method('delete')->willThrowException(new \RuntimeException('R2 down'));

        // L'exception ne doit PAS être avalée : Messenger doit pouvoir retenter.
        $this->expectException(\RuntimeException::class);
        (new CleanupR2ObjectHandler($r2))(new CleanupR2ObjectMessage('medias/abc.jpg'));
    }
}

<?php

namespace App\Service\Haccp;

final class HaccpSyncResult
{
    public function __construct(
        public int $creees = 0,
        public int $archivees = 0,
        public int $reactivees = 0,
        public int $inchangees = 0,
    ) {
    }

    public function toArray(): array
    {
        return [
            'creees' => $this->creees,
            'archivees' => $this->archivees,
            'reactivees' => $this->reactivees,
            'inchangees' => $this->inchangees,
        ];
    }
}

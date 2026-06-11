<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * Type d'entité parente à laquelle un Media est rattaché.
 *
 * Stockage : VARCHAR(20) (cf. CLAUDE.md règle 15 — pas d'ENUM MySQL natif).
 */
enum MediaEntityType: string
{
    case Mission = 'mission';
    case Tutoriel = 'tutoriel';
    case Document = 'document';
}

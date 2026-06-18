<?php

declare(strict_types=1);

namespace App\Constant;

/**
 * Seuils légaux du temps de travail (Code du travail / convention IDCC 1790
 * « Espaces de loisirs, d'attractions et culturels »).
 *
 * Source unique de vérité : ces constantes étaient auparavant codées en dur et
 * dupliquées dans PlanningService (prévention au planning) et ValidationHebdoService
 * (contrôle au pointage). Toute évolution réglementaire se fait ici.
 */
final class LegalThresholds
{
    /** Durée maximale de travail quotidienne — Art. L3121-18 : 10h. */
    public const MAX_JOURNALIER_MINUTES = 600;

    /** Durée maximale hebdomadaire absolue — Art. L3121-20 : 48h. */
    public const MAX_HEBDO_ABSOLU_HEURES = 48;

    /** Durée hebdomadaire moyenne sur 12 semaines glissantes — Art. L3121-22 : 44h. */
    public const MAX_HEBDO_MOYENNE_HEURES = 44;

    /** Repos quotidien minimal entre deux journées — Art. L3131-1 : 11h. */
    public const REPOS_QUOTIDIEN_HEURES = 11;

    /** Repos hebdomadaire minimal consécutif — Art. L3132-2 : 35h. */
    public const REPOS_HEBDO_HEURES = 35;

    /** Durée de shift au-delà de laquelle une pause est obligatoire — Art. L3121-16 : 6h. */
    public const PAUSE_SEUIL_MINUTES = 360;

    /** Durée minimale de pause au-delà du seuil — Art. L3121-16 : 20 min. */
    public const PAUSE_MIN_MINUTES = 20;

    /** Références légales par type d'alerte (affichées en tooltip front). */
    public const BASE_LEGALE = [
        'MAX_JOURNALIER' => 'Art. L3121-18 C. travail',
        'MAX_HEBDO_ABSOLU' => 'Art. L3121-20 C. travail',
        'MAX_HEBDO_MOYENNE' => 'Art. L3121-22 C. travail',
        'REPOS_QUOTIDIEN' => 'Art. L3131-1 C. travail',
        'REPOS_HEBDO' => 'Art. L3132-2 C. travail',
        'PAUSE_6H' => 'Art. L3121-16 C. travail',
    ];

    private function __construct()
    {
    }
}

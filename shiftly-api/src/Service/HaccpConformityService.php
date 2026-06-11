<?php

namespace App\Service;

use App\Entity\CompletionHaccpProof;
use App\Entity\MissionHaccpSpec;

/**
 * Calcule la conformité (`est_conforme`) d'une preuve HACCP.
 *
 * Logique métier extraite de l'ancien HaccpProofConformityChecker (listener
 * prePersist) — CLAUDE.md règle 7. Appelée explicitement à la création de la
 * preuve (HaccpController).
 *
 * Retourne NULL (= non applicable) : PHOTO, RECEPTION/temp sans valeur, DLC sans
 * date, pas de seuils.
 */
final class HaccpConformityService
{
    public function compute(CompletionHaccpProof $proof): ?bool
    {
        $spec = $proof->getCompletion()?->getMission()?->getHaccpSpec();
        if (!$spec instanceof MissionHaccpSpec) {
            return null;
        }

        return match ($spec->getTypeReleve()) {
            MissionHaccpSpec::TYPE_TEMPERATURE => $this->computeTemperature($proof, $spec),
            MissionHaccpSpec::TYPE_RECEPTION => $this->computeTemperature($proof, $spec),
            MissionHaccpSpec::TYPE_DLC => $this->computeDlc($proof),
            MissionHaccpSpec::TYPE_PHOTO => null, // jugé visuellement par le manager
            default => null,
        };
    }

    private function computeTemperature(CompletionHaccpProof $proof, MissionHaccpSpec $spec): ?bool
    {
        $valeur = $proof->getValeurNumerique();
        if (null === $valeur) {
            return null;
        }

        ['min' => $min, 'max' => $max] = $spec->getEffectiveSeuils();
        if (null === $min && null === $max) {
            return null;
        }

        if (null !== $min && $valeur < $min) {
            return false;
        }
        if (null !== $max && $valeur > $max) {
            return false;
        }

        return true;
    }

    private function computeDlc(CompletionHaccpProof $proof): ?bool
    {
        $date = $proof->getDateReleve();
        if (!$date) {
            return null;
        }
        // DLC dans le futur (>= aujourd'hui) = conforme
        $today = new \DateTimeImmutable('today');

        return $date >= $today;
    }
}

<?php

namespace App\EventListener;

use App\Entity\CompletionHaccpProof;
use App\Entity\MissionHaccpSpec;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Events;

/**
 * Calcule `est_conforme` à l'insert d'une CompletionHaccpProof.
 *
 * Source de vérité des seuils :
 *   1. Si la spec liée a un équipement → seuils de l'équipement
 *   2. Sinon → seuils portés par la spec
 *
 * Retourne NULL (= non applicable) :
 *   - TypeReleve PHOTO (pas de valeur quantitative)
 *   - RECEPTION sans valeur numérique
 *   - DLC sans dateReleve (impossible de juger)
 *   - Pas de seuils dispo
 */
#[AsDoctrineListener(event: Events::prePersist)]
final class HaccpProofConformityChecker
{
    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof CompletionHaccpProof) {
            return;
        }

        $entity->setEstConforme($this->compute($entity));
    }

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

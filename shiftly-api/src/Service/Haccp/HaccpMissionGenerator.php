<?php

namespace App\Service\Haccp;

use App\Entity\Centre;
use App\Entity\HaccpEquipement;
use App\Entity\Mission;
use App\Entity\MissionCategorie;
use App\Entity\MissionHaccpSpec;
use App\Entity\Zone;
use App\Repository\HaccpEquipementRepository;
use App\Repository\MissionCategorieRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Synchronisation idempotente des missions HACCP T° avec les équipements
 * actifs d'un centre.
 *
 * - Équipement ACTIF : crée si absentes les 2 missions T° (DEBUT_SERVICE +
 *   FIN_SERVICE), ou réactive les specs précédemment archivées.
 * - Équipement INACTIF : archive les specs T° associées (mission préservée
 *   pour l'historique des completions). Pas de `mission.archivee` (cf.
 *   "0 modif structurelle sur Mission") — c'est `MissionHaccpSpec::archivee`
 *   qui sert de drapeau et que le front filtre.
 * - Idempotent : appel répété ne duplique pas.
 * - Transactionnel : flush unique via wrapInTransaction.
 *
 * Pas de logique horaire en V1 — `moment` est juste un label affiché.
 */
final class HaccpMissionGenerator
{
    private const HACCP_CATEGORY_SLUG = 'HACCP';

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly HaccpEquipementRepository $equipements,
        private readonly MissionCategorieRepository $categories,
    ) {
    }

    public function synchronizeForCentre(Centre $centre): HaccpSyncResult
    {
        $result = new HaccpSyncResult();

        $this->em->wrapInTransaction(function () use ($centre, $result): void {
            // Garantit la catégorie HACCP au catalogue du centre
            $this->ensureHaccpCategorie($centre);

            // Zone par défaut pour les missions HACCP — Bar si dispo, sinon 1re zone
            $defaultZone = $this->resolveHaccpZone($centre);

            // Traite chaque équipement (actif + inactif) pour réconciliation
            $allEquipements = $this->em->getRepository(HaccpEquipement::class)
                ->findBy(['centre' => $centre]);

            foreach ($allEquipements as $equip) {
                $this->syncEquipement($equip, $defaultZone, $result);
            }
        });

        return $result;
    }

    private function syncEquipement(HaccpEquipement $equip, ?Zone $zone, HaccpSyncResult $result): void
    {
        $existing = []; // moment => MissionHaccpSpec
        foreach ($this->em->getRepository(MissionHaccpSpec::class)
            ->findBy(['equipement' => $equip, 'typeReleve' => MissionHaccpSpec::TYPE_TEMPERATURE]) as $spec) {
            $existing[$spec->getMoment() ?? ''] = $spec;
        }

        foreach ([MissionHaccpSpec::MOMENT_DEBUT_SERVICE, MissionHaccpSpec::MOMENT_FIN_SERVICE] as $moment) {
            $spec = $existing[$moment] ?? null;

            if ($equip->isActif()) {
                if (null === $spec) {
                    $this->createTemperatureMission($equip, $moment, $zone);
                    ++$result->creees;
                } elseif ($spec->isArchivee()) {
                    $spec->setArchivee(false);
                    ++$result->reactivees;
                } else {
                    ++$result->inchangees;
                }
            } else {
                if ($spec && !$spec->isArchivee()) {
                    $spec->setArchivee(true);
                    ++$result->archivees;
                } elseif ($spec) {
                    ++$result->inchangees;
                }
                // Pas de spec → équipement inactif sans mission, rien à faire
            }
        }
    }

    private function createTemperatureMission(HaccpEquipement $equip, string $moment, ?Zone $zone): void
    {
        $labelMoment = MissionHaccpSpec::MOMENT_DEBUT_SERVICE === $moment ? 'début de service' : 'fin de service';
        $texte = sprintf('Relevé T° %s — %s', $equip->getNom(), $labelMoment);

        // Mission rattachée à la zone HACCP (ou à la première zone du centre).
        // Si aucune zone existe, on lève une exception explicite — l'auto-seed
        // doit garantir au minimum une zone.
        if (null === $zone) {
            throw new \RuntimeException(sprintf('Aucune zone disponible pour le centre %s — impossible de créer la mission HACCP.', $equip->getCentre()?->getId()));
        }

        $mission = (new Mission())
            ->setZone($zone)
            ->setTexte($texte)
            ->setCategorie('HACCP')
            ->setFrequence(Mission::FREQ_FIXE)
            ->setPriorite(Mission::PRIO_VITALE)
            ->setOrdre(MissionHaccpSpec::MOMENT_DEBUT_SERVICE === $moment ? 1 : 99)
            ->setRequiresPhoto(false);

        $spec = (new MissionHaccpSpec())
            ->setMission($mission)
            ->setCentre($equip->getCentre())
            ->setEquipement($equip)
            ->setTypeReleve(MissionHaccpSpec::TYPE_TEMPERATURE)
            ->setMoment($moment)
            ->setCommentaireObligatoire(false)
            ->setPhotoObligatoire(false);

        $mission->setHaccpSpec($spec);

        $this->em->persist($mission);
        $this->em->persist($spec);
    }

    private function ensureHaccpCategorie(Centre $centre): MissionCategorie
    {
        $existing = $this->categories->findOneBy(['centre' => $centre, 'nom' => 'HACCP']);
        if ($existing) {
            return $existing;
        }

        $cat = (new MissionCategorie())
            ->setCentre($centre)
            ->setNom('HACCP')
            ->setCouleur('#ef4444')
            ->setIcone('🍔')
            ->setOrdre(50);
        $this->em->persist($cat);

        return $cat;
    }

    private function resolveHaccpZone(Centre $centre): ?Zone
    {
        $zoneRepo = $this->em->getRepository(Zone::class);
        $bar = $zoneRepo->findOneBy(['centre' => $centre, 'nom' => 'Bar']);
        if ($bar) {
            return $bar;
        }
        $any = $zoneRepo->findBy(['centre' => $centre], ['ordre' => 'ASC'], 1);

        return $any[0] ?? null;
    }
}

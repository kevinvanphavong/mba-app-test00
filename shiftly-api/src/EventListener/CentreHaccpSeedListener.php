<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Centre;
use App\Entity\HaccpEquipement;
use App\Entity\Mission;
use App\Entity\MissionHaccpSpec;
use App\Entity\Zone;
use App\Service\Haccp\HaccpMissionGenerator;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Events;

/**
 * À la création d'un nouveau Centre, seed le module HACCP :
 *   - 2 équipements types (Frigo bar principal, Congélateur cuisine)
 *   - 3 missions standalone (DLC, étiquetage produit ouvert, réception fournisseur)
 *   - Appelle HaccpMissionGenerator → crée les 4 missions T° (2 équipements × 2 moments)
 *
 * La catégorie "HACCP" et la zone par défaut sont créées par le générateur.
 * Si aucune zone n'existe sur le centre, on crée d'abord "Bar" pour servir
 * de rattachement aux missions HACCP.
 */
#[AsDoctrineListener(event: Events::postPersist)]
final class CentreHaccpSeedListener
{
    private const EQUIPEMENTS = [
        ['Frigo bar principal',  HaccpEquipement::TYPE_FRIGO,        0.0,   4.0],
        ['Congélateur cuisine',  HaccpEquipement::TYPE_CONGELATEUR, -22.0, -18.0],
    ];

    private const MISSIONS_STANDALONE = [
        ['Contrôle DLC produits frais',        MissionHaccpSpec::TYPE_DLC,       true],
        ['Étiquetage produit ouvert (date)',   MissionHaccpSpec::TYPE_PHOTO,     true],
        ['Réception fournisseur',              MissionHaccpSpec::TYPE_RECEPTION, true],
    ];

    public function __construct(private readonly HaccpMissionGenerator $generator) {}

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Centre) return;

        $em = $args->getObjectManager();

        // Garantit une zone "Bar" pour rattacher les missions HACCP
        $zoneRepo = $em->getRepository(Zone::class);
        $bar = $zoneRepo->findOneBy(['centre' => $entity, 'nom' => 'Bar']);
        if (!$bar) {
            $bar = (new Zone())
                ->setCentre($entity)
                ->setNom('Bar')
                ->setCouleur('#a855f7')
                ->setOrdre(2);
            $em->persist($bar);
        }

        // 2 équipements types
        $now = 0;
        foreach (self::EQUIPEMENTS as [$nom, $type, $min, $max]) {
            $equip = (new HaccpEquipement())
                ->setCentre($entity)
                ->setNom($nom)
                ->setType($type)
                ->setSeuilMin($min)
                ->setSeuilMax($max)
                ->setUnite('°C')
                ->setOrdre(++$now)
                ->setActif(true);
            $em->persist($equip);
        }

        // 3 missions standalone (DLC / Étiquetage / Réception)
        foreach (self::MISSIONS_STANDALONE as [$texte, $type, $photoOblig]) {
            $mission = (new Mission())
                ->setZone($bar)
                ->setTexte($texte)
                ->setCategorie('HACCP')
                ->setFrequence(Mission::FREQ_FIXE)
                ->setPriorite(Mission::PRIO_VITALE)
                ->setOrdre(50);

            $spec = (new MissionHaccpSpec())
                ->setMission($mission)
                ->setCentre($entity)
                ->setTypeReleve($type)
                ->setPhotoObligatoire($photoOblig);

            $mission->setHaccpSpec($spec);
            $em->persist($mission);
            $em->persist($spec);
        }

        // Flush nécessaire pour matérialiser les équipements avant le générateur
        $em->flush();

        // Sync auto → crée les 4 missions T° (2 équipements × DEBUT/FIN)
        $this->generator->synchronizeForCentre($entity);
    }
}

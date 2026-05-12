<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Centre;
use App\Entity\MissionCategorie;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Events;

/**
 * À la création d'un nouveau Centre (POST /api/centres ou via code),
 * seed automatiquement les 4 catégories de mission par défaut.
 *
 * Évite que la page /postes apparaisse vide pour un manager qui vient
 * d'être attaché à un centre fraîchement créé. Le manager peut renommer
 * / supprimer / réorganiser ces catégories après coup.
 */
#[AsDoctrineListener(event: Events::postPersist)]
final class CentreCategoriesSeedListener
{
    /** @var array<int, array{string, string, string, int}> */
    private const DEFAULTS = [
        ['Ouverture', '#3b82f6', '🔓', 1],
        ['Pendant',   '#22c55e', '⚡', 2],
        ['Ménage',    '#a855f7', '🧽', 3],
        ['Fermeture', '#f97316', '🔒', 4],
    ];

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Centre) {
            return;
        }

        $em = $args->getObjectManager();
        foreach (self::DEFAULTS as [$nom, $couleur, $icone, $ordre]) {
            $cat = (new MissionCategorie())
                ->setCentre($entity)
                ->setNom($nom)
                ->setCouleur($couleur)
                ->setIcone($icone)
                ->setOrdre($ordre);
            $em->persist($cat);
        }
        // Flush explicite : Doctrine ne re-scanne pas l'UnitOfWork après un postPersist,
        // les nouvelles entités persist()ées dans cet event seraient sinon ignorées.
        // MissionCategorie n'a pas de listener → pas de risque de boucle infinie.
        $em->flush();
    }
}

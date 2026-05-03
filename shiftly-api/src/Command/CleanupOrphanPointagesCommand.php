<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Pointage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Purge les Pointages orphelins :
 *   - statut = PREVU (jamais commencé)
 *   - poste_id NULL (FK orpheline) OU poste référencé qui n'existe plus
 *
 * Contexte : avant l'introduction de PostePreRemoveListener, supprimer un Poste
 * laissait son Pointage en BDD avec une FK cassée. Cette commande nettoie
 * l'ardoise après déploiement du fix.
 *
 * Usage :
 *   php bin/console pointage:cleanup-orphans            # dry-run par défaut
 *   php bin/console pointage:cleanup-orphans --apply    # exécute la suppression
 */
#[AsCommand(
    name: 'pointage:cleanup-orphans',
    description: 'Supprime les Pointages PREVU dont le Poste n\'existe plus.',
)]
class CleanupOrphanPointagesCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'apply',
            null,
            InputOption::VALUE_NONE,
            'Exécute la suppression. Sans ce flag, la commande tourne en dry-run.'
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io    = new SymfonyStyle($input, $output);
        $apply = (bool) $input->getOption('apply');

        $io->title('Nettoyage des pointages orphelins');

        // 1) Pointages PREVU avec poste_id NULL (orphelin explicite)
        $nullPosteIds = $this->em->createQuery(
            'SELECT p.id FROM App\Entity\Pointage p
             WHERE p.statut = :statut AND p.poste IS NULL'
        )
            ->setParameter('statut', Pointage::STATUT_PREVU)
            ->getSingleColumnResult();

        // 2) Pointages PREVU dont la FK pointe vers un Poste qui n'existe plus.
        //    On utilise une LEFT JOIN + WHERE poste IS NULL via la relation
        //    pour ne pas dépendre du driver SQL.
        $danglingPosteIds = $this->em->createQuery(
            'SELECT p.id FROM App\Entity\Pointage p
             LEFT JOIN p.poste po
             WHERE p.statut = :statut AND p.poste IS NOT NULL AND po.id IS NULL'
        )
            ->setParameter('statut', Pointage::STATUT_PREVU)
            ->getSingleColumnResult();

        $allIds = array_unique(array_merge($nullPosteIds, $danglingPosteIds));
        $count  = count($allIds);

        if ($count === 0) {
            $io->success('Aucun pointage orphelin trouvé. Base propre.');
            return Command::SUCCESS;
        }

        $io->section("$count pointage(s) orphelin(s) détecté(s)");
        $io->writeln('IDs : ' . implode(', ', $allIds));

        if (!$apply) {
            $io->warning('Dry-run : aucune suppression effectuée. Relance avec --apply pour purger.');
            return Command::SUCCESS;
        }

        // Suppression en bulk via DQL (plus rapide qu'em->remove un par un)
        $deleted = $this->em->createQuery(
            'DELETE FROM App\Entity\Pointage p WHERE p.id IN (:ids)'
        )
            ->setParameter('ids', $allIds)
            ->execute();

        $io->success("$deleted pointage(s) supprimé(s).");
        return Command::SUCCESS;
    }
}

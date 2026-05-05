<?php

declare(strict_types=1);

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Finder\Finder;

/**
 * Purge les photos de completion orphelines :
 *   - Scanne public/uploads/completion/** pour lister tous les fichiers présents.
 *   - Récupère tous les photoPath actifs en BDD.
 *   - Tout fichier sur disque non référencé en BDD = orphelin → suppression.
 *
 * Contexte : avant l'introduction de CompletionPhotoCleanupListener, décocher
 * une mission requiresPhoto laissait le fichier physique sur disque alors que
 * la ligne BDD partait. Cette commande nettoie l'historique après déploiement
 * du fix. À exécuter une fois en --apply en prod, puis plus jamais nécessaire.
 *
 * Usage :
 *   php bin/console completion:cleanup-orphan-photos            # dry-run par défaut
 *   php bin/console completion:cleanup-orphan-photos --apply    # exécute la suppression
 */
#[AsCommand(
    name: 'completion:cleanup-orphan-photos',
    description: 'Supprime les photos de completion orphelines sur disque (non référencées en BDD).',
)]
class CleanupOrphanCompletionPhotosCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $projectDir,
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

        $io->title('Nettoyage des photos de completion orphelines');

        $uploadsDir = $this->projectDir . '/public/uploads/completion';

        // Cas dossier inexistant (jamais aucun upload) → rien à faire
        if (!is_dir($uploadsDir)) {
            $io->success('Dossier public/uploads/completion/ inexistant. Rien à nettoyer.');
            return Command::SUCCESS;
        }

        // 1) Liste les fichiers physiques (chemin relatif depuis public/)
        $finder = new Finder();
        $finder->files()->in($uploadsDir);

        if (!$finder->hasResults()) {
            $io->success('Dossier vide. Rien à nettoyer.');
            return Command::SUCCESS;
        }

        $publicDir = $this->projectDir . '/public/';
        $diskFiles = []; // relativePath => absolutePath
        foreach ($finder as $file) {
            $absolutePath = $file->getRealPath();
            if ($absolutePath === false) {
                continue;
            }
            // Convertit en chemin relatif depuis public/ pour matcher le format BDD.
            $relativePath = ltrim(str_replace($publicDir, '', $absolutePath), '/');
            $diskFiles[$relativePath] = $absolutePath;
        }

        // 2) Liste les photoPath référencés en BDD
        $dbPaths = $this->em->createQuery(
            'SELECT c.photoPath FROM App\Entity\Completion c WHERE c.photoPath IS NOT NULL'
        )->getSingleColumnResult();

        // Set PHP via array_flip pour lookup O(1)
        $dbSet = array_flip($dbPaths);

        // 3) Diff : fichiers disque non référencés en BDD
        $orphans = [];
        foreach ($diskFiles as $relativePath => $absolutePath) {
            if (!isset($dbSet[$relativePath])) {
                $orphans[$relativePath] = $absolutePath;
            }
        }

        $count = count($orphans);

        if ($count === 0) {
            $io->success(sprintf(
                'Aucune photo orpheline. %d fichier(s) sur disque, tous référencés en BDD.',
                count($diskFiles)
            ));
            return Command::SUCCESS;
        }

        $totalSize = 0;
        foreach ($orphans as $absolutePath) {
            $size = @filesize($absolutePath);
            if ($size !== false) {
                $totalSize += $size;
            }
        }

        $io->section(sprintf(
            '%d photo(s) orpheline(s) détectée(s) — %s à libérer',
            $count,
            $this->formatBytes($totalSize)
        ));

        // Affiche au plus 20 chemins pour ne pas spammer
        $preview = array_slice(array_keys($orphans), 0, 20);
        foreach ($preview as $relativePath) {
            $io->writeln('  - ' . $relativePath);
        }
        if ($count > count($preview)) {
            $io->writeln(sprintf('  ... et %d autre(s)', $count - count($preview)));
        }

        if (!$apply) {
            $io->warning('Dry-run : aucune suppression effectuée. Relance avec --apply pour purger.');
            return Command::SUCCESS;
        }

        // 4) Suppression — on continue la boucle même si un unlink échoue (permissions)
        $deleted  = 0;
        $failed   = 0;
        $freed    = 0;
        foreach ($orphans as $relativePath => $absolutePath) {
            $size = @filesize($absolutePath) ?: 0;
            if (@unlink($absolutePath)) {
                $deleted++;
                $freed += $size;
            } else {
                $failed++;
                $io->warning(sprintf('Échec suppression : %s', $relativePath));
            }
        }

        $io->success(sprintf(
            '%d photo(s) supprimée(s) — %s libéré%s.',
            $deleted,
            $this->formatBytes($freed),
            $failed > 0 ? sprintf(' (%d échec[s])', $failed) : ''
        ));

        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . ' B';
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        if ($bytes < 1024 * 1024 * 1024) {
            return round($bytes / (1024 * 1024), 1) . ' MB';
        }
        return round($bytes / (1024 * 1024 * 1024), 2) . ' GB';
    }
}

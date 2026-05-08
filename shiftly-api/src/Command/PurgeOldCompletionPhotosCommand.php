<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Completion;
use App\Service\R2StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Purge les photos Completion plus anciennes que 90 jours :
 *   - delete binaire R2
 *   - null `photoPath` / `photoMimeType` / `photoTakenAt`
 *
 * Idempotente : peut être relancée sans risque. Flush par batch de 50.
 *
 * Usage :
 *   php bin/console app:purge-old-completion-photos              # exécute
 *   php bin/console app:purge-old-completion-photos --dry-run    # affiche sans toucher
 *
 * À planifier en cron Railway : quotidien 03:00 UTC.
 */
#[AsCommand(
    name: 'app:purge-old-completion-photos',
    description: 'Purge les photos Completion > 90 jours (R2 + BDD)',
)]
class PurgeOldCompletionPhotosCommand extends Command
{
    private const RETENTION_DAYS = 90;
    private const BATCH_SIZE     = 50;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly R2StorageService       $r2,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'dry-run',
            null,
            \Symfony\Component\Console\Input\InputOption::VALUE_NONE,
            'Affiche les Completion à purger sans rien supprimer.',
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io     = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $cutoff = (new \DateTimeImmutable())->modify('-' . self::RETENTION_DAYS . ' days');
        $io->title('Purge photos Completion > ' . self::RETENTION_DAYS . ' jours');
        $io->writeln(sprintf('Cutoff : %s', $cutoff->format(\DateTimeInterface::ATOM)));
        if ($dryRun) {
            $io->warning('DRY-RUN — aucune suppression réelle.');
        }

        $qb = $this->em->getRepository(Completion::class)->createQueryBuilder('c')
            ->andWhere('c.photoPath IS NOT NULL')
            ->andWhere('c.photoTakenAt < :cutoff')
            ->setParameter('cutoff', $cutoff)
            ->orderBy('c.id', 'ASC');

        $iter = $qb->getQuery()->toIterable();

        $deleted = 0;
        $failed  = 0;
        $batch   = 0;

        foreach ($iter as $completion) {
            /** @var Completion $completion */
            $key = $completion->getPhotoPath();
            if ($key === null) {
                continue;
            }

            if ($dryRun) {
                $io->writeln(sprintf('  - #%d %s', $completion->getId(), $key));
                $deleted++;
                continue;
            }

            // Binaire R2 d'abord (sinon orphelins sur le bucket)
            try {
                $this->r2->delete($key);
            } catch (\Throwable $e) {
                $failed++;
                $io->writeln(sprintf('  ✗ #%d delete R2 KO : %s', $completion->getId(), $e->getMessage()));
                // On null quand même la BDD : R2 a peut-être déjà supprimé en amont
            }

            $completion->setPhotoPath(null);
            $completion->setPhotoMimeType(null);
            $completion->setPhotoTakenAt(null);

            $deleted++;
            $batch++;

            if ($batch >= self::BATCH_SIZE) {
                $this->em->flush();
                $this->em->clear();
                $batch = 0;
            }
        }

        if (!$dryRun && $batch > 0) {
            $this->em->flush();
        }

        $io->success(sprintf(
            '%d photo%s purgée%s%s',
            $deleted,
            $deleted > 1 ? 's' : '',
            $deleted > 1 ? 's' : '',
            $failed > 0 ? sprintf(' (%d échec(s) R2 — BDD nullée quand même)', $failed) : '',
        ));

        return Command::SUCCESS;
    }
}

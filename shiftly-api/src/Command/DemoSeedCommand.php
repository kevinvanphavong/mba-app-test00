<?php

namespace App\Command;

use App\Entity\Centre;
use App\Entity\PlanningWeek;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\User;
use App\Entity\Zone;
use App\Service\PlanningService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\NullOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Recharge le jeu de données de démo (fixtures Alice) PUIS étend les services et
 * plannings sur 3 semaines glissantes — semaine dernière (TERMINE), courante
 * (EN_COURS le jour même, PLANIFIE le reste) et prochaine (PLANIFIE) — toujours
 * recalculées à la date d'exécution. Sert à « rafraîchir » la démo avant une
 * présentation : les écrans Planning/Service montrent toujours du passé/présent/futur.
 *
 * Rejouable et déterministe (purge + recharge + génération sans aléa).
 *
 * ⚠️ EFFACE la base. En prod (`APP_ENV=prod`), exige `--force` + confirmation.
 */
#[AsCommand(name: 'app:demo:seed', description: 'Recharge la démo + services/plannings sur 3 semaines glissantes')]
final class DemoSeedCommand extends Command
{
    /** Ordre lundi→dimanche aligné sur le format ISO `N` (1=lundi). */
    private const DAY_KEYS = [1 => 'lundi', 2 => 'mardi', 3 => 'mercredi', 4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi', 7 => 'dimanche'];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanningService $planningService,
        #[Autowire('%kernel.environment%')]
        private readonly string $kernelEnv,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Obligatoire en prod : confirme la purge + rechargement de la base.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // ── Garde-fou prod ───────────────────────────────────────────────────
        if ('prod' === $this->kernelEnv) {
            if (!$input->getOption('force')) {
                $io->error('APP_ENV=prod : cette commande EFFACE et recharge toute la base. Relance avec --force pour confirmer.');

                return Command::FAILURE;
            }
            if ($input->isInteractive() && !$io->confirm('⚠️  PROD : cela EFFACE toutes les données existantes et recharge la démo. Confirmer ?', false)) {
                $io->warning('Annulé. Aucune donnée modifiée.');

                return Command::FAILURE;
            }
        }

        // ── 1. Recharge les fixtures Alice (purge + truncate) ─────────────────
        $io->section('Rechargement des fixtures de démo');
        $code = $this->reloadFixtures($io);
        if (Command::SUCCESS !== $code) {
            $io->error('Échec du rechargement des fixtures Alice.');

            return $code;
        }
        $this->em->clear(); // les entités chargées par la sous-commande sont détachées
        $io->writeln('Fixtures rechargées.');

        // ── 2. Étend services + plannings sur 3 semaines glissantes ───────────
        $lundiCourant = new \DateTimeImmutable('monday this week');
        $today = new \DateTimeImmutable('today');
        $semaines = [
            $lundiCourant->modify('-7 days'), // S-1
            $lundiCourant,                    // S
            $lundiCourant->modify('+7 days'), // S+1
        ];

        $io->section(sprintf(
            'Génération 3 semaines : %s → %s',
            $semaines[0]->format('Y-m-d'),
            end($semaines)->modify('+6 days')->format('Y-m-d')
        ));

        $stats = ['centres' => 0, 'services' => 0, 'postes' => 0, 'plannings' => 0];

        /** @var Centre[] $centres */
        $centres = $this->em->getRepository(Centre::class)->findAll();
        foreach ($centres as $centre) {
            $zones = $this->em->getRepository(Zone::class)->findBy(['centre' => $centre], ['ordre' => 'ASC']);
            $employes = $this->em->getRepository(User::class)->findBy(['centre' => $centre, 'role' => 'EMPLOYE', 'actif' => true], ['id' => 'ASC']);

            // Centre de démo exploitable = au moins une zone et un employé actif.
            if (\count($zones) < 1 || \count($employes) < 1) {
                continue;
            }

            ++$stats['centres'];
            $dayIndex = 0; // compteur global pour la rotation déterministe du staff

            foreach ($semaines as $lundi) {
                $this->getOrCreatePlanningWeek($centre, $lundi);
                ++$stats['plannings'];

                for ($d = 0; $d < 7; ++$d) {
                    $date = $lundi->modify("+{$d} days");
                    if (!$this->centreEstOuvert($centre, $date)) {
                        continue;
                    }

                    $service = $this->getOrCreateService($centre, $date, $today, $stats);

                    // On ne touche pas aux services déjà garnis par les fixtures
                    // (planning soigné à la main) — on ne remplit que les jours vides.
                    if ($service->getPostes()->count() > 0) {
                        ++$dayIndex;
                        continue;
                    }

                    $this->genererPostes($service, $zones, $employes, $dayIndex, $stats);
                    ++$dayIndex;
                }
            }

            $this->em->flush();
        }

        $io->success(sprintf(
            '%d centres · %d plannings (semaines) · %d services · %d postes générés sur la plage %s → %s.',
            $stats['centres'], $stats['plannings'], $stats['services'], $stats['postes'],
            $semaines[0]->format('Y-m-d'), end($semaines)->modify('+6 days')->format('Y-m-d')
        ));
        $io->writeln('→ Planning : navigue ‹ › pour voir S-1 / S / S+1. Services : passé (TERMINE) et futur (PLANIFIE).');

        return Command::SUCCESS;
    }

    /**
     * Recharge les fixtures via hautelook:fixtures:load --purge-with-truncate.
     * Sortie silencieuse (NullOutput) — on ne garde que notre récap.
     */
    private function reloadFixtures(SymfonyStyle $io): int
    {
        $application = $this->getApplication();
        if (null === $application) {
            $io->error('Application console indisponible.');

            return Command::FAILURE;
        }

        $command = $application->find('hautelook:fixtures:load');
        $loadInput = new ArrayInput(['--purge-with-truncate' => true]);
        $loadInput->setInteractive(false);

        return $command->run($loadInput, new NullOutput());
    }

    private function getOrCreatePlanningWeek(Centre $centre, \DateTimeImmutable $lundi): PlanningWeek
    {
        $pw = $this->em->getRepository(PlanningWeek::class)->findOneBy(['centre' => $centre, 'weekStart' => $lundi]);
        if ($pw instanceof PlanningWeek) {
            return $pw;
        }

        $pw = (new PlanningWeek())
            ->setCentre($centre)
            ->setWeekStart($lundi)
            ->setStatut(PlanningWeek::STATUT_PUBLIE)
            ->setPublishedAt($lundi->setTime(8, 30));
        $this->em->persist($pw);

        return $pw;
    }

    /**
     * @param array{centres:int,services:int,postes:int,plannings:int} $stats
     */
    private function getOrCreateService(Centre $centre, \DateTimeImmutable $date, \DateTimeImmutable $today, array &$stats): Service
    {
        $statut = $date < $today
            ? Service::STATUT_TERMINE
            : ($date == $today ? Service::STATUT_EN_COURS : Service::STATUT_PLANIFIE);

        $service = $this->em->getRepository(Service::class)->findOneBy(['centre' => $centre, 'date' => $date]);
        if ($service instanceof Service) {
            $service->setStatut($statut); // resynchronise selon la date d'exécution

            return $service;
        }

        $service = (new Service())
            ->setCentre($centre)
            ->setDate($date)
            ->setStatut($statut)
            ->setTauxCompletion(Service::STATUT_TERMINE === $statut ? 100.0 : 0.0);
        $this->planningService->applyCentreOpeningHoursToService($service, $centre, $date);
        $this->em->persist($service);
        ++$stats['services'];

        return $service;
    }

    /**
     * Génère un planning par défaut : une rotation déterministe du staff sur les
     * zones, aux horaires d'ouverture du service. Respecte uniq_poste (zones
     * distinctes, employés distincts sur un même service).
     *
     * @param Zone[]                                                   $zones
     * @param User[]                                                   $employes
     * @param array{centres:int,services:int,postes:int,plannings:int} $stats
     */
    private function genererPostes(Service $service, array $zones, array $employes, int $dayIndex, array &$stats): void
    {
        $debut = $service->getHeureDebut() ?? \DateTimeImmutable::createFromFormat('H:i', '10:00');
        $fin = $service->getHeureFin() ?? \DateTimeImmutable::createFromFormat('H:i', '18:00');
        if (false === $debut || false === $fin) {
            return;
        }

        $nbPostes = min(\count($zones), \count($employes));
        for ($i = 0; $i < $nbPostes; ++$i) {
            $zone = $zones[$i];
            $emp = $employes[($i + $dayIndex) % \count($employes)]; // rotation jour par jour

            $poste = (new Poste())
                ->setService($service)
                ->setZone($zone)
                ->setUser($emp)
                ->setHeureDebut($debut)
                ->setHeureFin($fin)
                ->setPauseMinutes(30);
            $this->em->persist($poste);
            ++$stats['postes'];
        }
    }

    private function centreEstOuvert(Centre $centre, \DateTimeImmutable $date): bool
    {
        $hours = $centre->getOpeningHours() ?? [];
        $key = self::DAY_KEYS[(int) $date->format('N')];

        return !empty($hours[$key]['ouvert']);
    }
}

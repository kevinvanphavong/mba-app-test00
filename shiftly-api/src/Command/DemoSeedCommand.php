<?php

namespace App\Command;

use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\PlanningWeek;
use App\Entity\Pointage;
use App\Entity\PointagePause;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\User;
use App\Entity\Zone;
use App\Service\PiiCipher;
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
 * plannings sur 5 semaines glissantes — semaine dernière (TERMINE), courante
 * (EN_COURS le jour même, PLANIFIE le reste) et les 3 suivantes (PLANIFIE) —
 * toujours recalculées à la date d'exécution. Sert à « rafraîchir » la démo avant
 * une présentation : les écrans Planning/Service montrent toujours du
 * passé/présent/futur, et on peut naviguer vers l'avant sans tomber sur du vide.
 *
 * Rejouable et déterministe (purge + recharge + génération sans aléa).
 *
 * ⚠️ EFFACE la base. En prod (`APP_ENV=prod`), exige `--force` + confirmation.
 */
#[AsCommand(name: 'app:demo:seed', description: 'Recharge la démo + services/plannings sur 5 semaines glissantes')]
final class DemoSeedCommand extends Command
{
    /** Ordre lundi→dimanche aligné sur le format ISO `N` (1=lundi). */
    private const DAY_KEYS = [1 => 'lundi', 2 => 'mardi', 3 => 'mercredi', 4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi', 7 => 'dimanche'];

    /** Séquence d'absences déterministe : REPOS dominant, tous les types présents. */
    private const ABSENCE_SEQ = ['REPOS', 'CP', 'REPOS', 'RTT', 'REPOS', 'MALADIE', 'REPOS', 'EVENEMENT_FAMILLE', 'REPOS', 'AUTRE', 'REPOS', 'RTT'];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanningService $planningService,
        private readonly PiiCipher $cipher,
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

        // ── Prérequis vérifié AVANT la purge ─────────────────────────────────
        // Les fixtures contiennent des contacts CRM dont les PII passent par le type
        // Doctrine `encrypted_string`. Sans clé, le chiffrement lève au milieu du
        // chargement : base déjà purgée, fixtures à moitié posées — et au déploiement
        // (entrypoint.sh en `set -e`) le container ne démarre plus. On échoue avant.
        if (!$this->cipher->isConfigured()) {
            $io->error([
                'PII_ENCRYPTION_KEY manquante : les contacts CRM des fixtures ne peuvent pas être chiffrés.',
                'Aucune donnée modifiée. Génère une clé puis relance :',
                'php -r "echo base64_encode(random_bytes(32));"',
            ]);

            return Command::FAILURE;
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

        // ── 1 bis. Recalcule les emailHash des contacts CRM ───────────────────
        // Le hash est salé par l'id du centre, inconnu au moment d'écrire le YAML :
        // les fixtures posent un placeholder, on le remplace par le vrai hash pour
        // que la déduplication (avis publics, ingestion) fonctionne en démo.
        $rehashes = $this->rehashContacts();
        $io->writeln(sprintf('Contacts CRM : %d emailHash recalculés.', $rehashes));

        // ── 2. Étend services + plannings sur 5 semaines glissantes ───────────
        // Une seule semaine passée suffit (c'est elle qui alimente la validation
        // hebdo), mais on planifie 3 semaines à venir : en démo, on navigue vers
        // l'avant et une semaine vide casse la démonstration.
        $lundiCourant = new \DateTimeImmutable('monday this week');
        $today = new \DateTimeImmutable('today');
        $semaines = [
            $lundiCourant->modify('-7 days'),  // S-1
            $lundiCourant,                     // S
            $lundiCourant->modify('+7 days'),  // S+1
            $lundiCourant->modify('+14 days'), // S+2
            $lundiCourant->modify('+21 days'), // S+3
        ];

        $io->section(sprintf(
            'Génération %d semaines : %s → %s',
            \count($semaines),
            $semaines[0]->format('Y-m-d'),
            end($semaines)->modify('+6 days')->format('Y-m-d')
        ));

        $stats = ['centres' => 0, 'services' => 0, 'postes' => 0, 'plannings' => 0, 'pointages' => 0, 'absences' => 0];
        $now = new \DateTimeImmutable('now');

        /** @var Centre[] $centres */
        $centres = $this->em->getRepository(Centre::class)->findAll();
        foreach ($centres as $centre) {
            $zones = $this->em->getRepository(Zone::class)->findBy(['centre' => $centre], ['ordre' => 'ASC']);
            $employes = $this->em->getRepository(User::class)->findBy(['centre' => $centre, 'role' => 'EMPLOYE', 'actif' => true], ['id' => 'ASC']);

            // Centre de démo exploitable = au moins une zone et un employé actif.
            if (\count($zones) < 1 || \count($employes) < 1) {
                continue;
            }
            $manager = $this->em->getRepository(User::class)->findOneBy(['centre' => $centre, 'role' => 'MANAGER', 'actif' => true]);

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

                    // Services déjà garnis par les fixtures (planning soigné à la main) :
                    // on les conserve et on ne remplit que les jours vides.
                    $preexistant = $service->getPostes()->count() > 0;
                    $postes = $preexistant
                        ? $service->getPostes()->toArray()
                        : $this->genererPostes($service, $zones, $employes, $dayIndex, $stats);

                    // Absence crédible : un employé non planifié ce jour (type tournant).
                    $this->genererAbsence($centre, $employes, $postes, $manager, $date, $dayIndex, $stats);

                    // Heures pointées : jours passés (TERMINE) + en cours aujourd'hui.
                    if ($date <= $today) {
                        $this->genererPointages($service, $postes, $manager, $today, $now, $preexistant, $dayIndex, $stats);
                    }

                    ++$dayIndex;
                }
            }

            $this->em->flush();
        }

        $io->success(sprintf(
            '%d centres · %d plannings · %d services · %d postes · %d pointages · %d absences sur la plage %s → %s.',
            $stats['centres'], $stats['plannings'], $stats['services'], $stats['postes'], $stats['pointages'], $stats['absences'],
            $semaines[0]->format('Y-m-d'), end($semaines)->modify('+6 days')->format('Y-m-d')
        ));
        $io->writeln('→ Planning : navigue ‹ › de S-1 à S+3. Services : passé (TERMINE) / futur (PLANIFIE). Validation hebdo : utilisable sur S-1 (heures pointées + retards + no-show + absences).');

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

    /**
     * Réaligne `Contact::emailHash` sur le HMAC salé par centre. Sans clé PII
     * configurée, on ne touche à rien (les placeholders des fixtures restent).
     *
     * @return int nombre de contacts corrigés
     */
    private function rehashContacts(): int
    {
        if (!$this->cipher->isConfigured()) {
            return 0;
        }

        $corriges = 0;
        foreach ($this->em->getRepository(Contact::class)->findAll() as $contact) {
            $email = $contact->getEmail();
            $centreId = $contact->getCentre()?->getId();
            if (null === $email || null === $centreId) {
                continue;
            }
            $hash = $this->cipher->hashEmail($email, $centreId);
            if ($hash !== $contact->getEmailHash()) {
                $contact->setEmailHash($hash);
                ++$corriges;
            }
        }
        $this->em->flush();

        return $corriges;
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
     * @param array{centres:int,services:int,postes:int,plannings:int,pointages:int,absences:int} $stats
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
     * @param Zone[]                                                                              $zones
     * @param User[]                                                                              $employes
     * @param array{centres:int,services:int,postes:int,plannings:int,pointages:int,absences:int} $stats
     *
     * @return Poste[] les postes créés
     */
    private function genererPostes(Service $service, array $zones, array $employes, int $dayIndex, array &$stats): array
    {
        $debut = $service->getHeureDebut() ?? \DateTimeImmutable::createFromFormat('H:i', '10:00');
        $fin = $service->getHeureFin() ?? \DateTimeImmutable::createFromFormat('H:i', '18:00');
        if (false === $debut || false === $fin) {
            return [];
        }

        $created = [];
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
            $created[] = $poste;
        }

        return $created;
    }

    /**
     * Génère les heures pointées d'un service : retards déterministes, no-show
     * occasionnel, pause repas, départ légèrement décalé. Aujourd'hui → EN_COURS
     * si le shift n'est pas fini. Rend la Validation hebdo utilisable en démo.
     *
     * @param Poste[]                                                                             $postes
     * @param array{centres:int,services:int,postes:int,plannings:int,pointages:int,absences:int} $stats
     */
    private function genererPointages(Service $service, array $postes, ?User $manager, \DateTimeImmutable $today, \DateTimeImmutable $now, bool $verifierExistant, int $dayIndex, array &$stats): void
    {
        $date = $service->getDate();
        if (null === $date) {
            return;
        }
        $estAujourdhui = $date == $today;

        foreach ($postes as $i => $poste) {
            // Sur les services déjà garnis par les fixtures, ne pas dupliquer un pointage.
            if ($verifierExistant && null !== $this->em->getRepository(Pointage::class)->findOneBy(['poste' => $poste])) {
                continue;
            }
            $hd = $poste->getHeureDebut();
            $hf = $poste->getHeureFin();
            if (null === $hd || null === $hf) {
                continue;
            }

            $shiftStart = $date->setTime((int) $hd->format('H'), (int) $hd->format('i'));
            $shiftEnd = $date->setTime((int) $hf->format('H'), (int) $hf->format('i'));
            if ($shiftEnd <= $shiftStart) {
                $shiftEnd = $shiftEnd->modify('+1 day'); // service de nuit
            }

            // Aujourd'hui : shift pas encore commencé → reste « prévu » (pas de pointage).
            if ($estAujourdhui && $shiftStart > $now) {
                continue;
            }

            $seed = $dayIndex * 7 + (int) $i;
            $estTermine = $shiftEnd < $now;

            // No-show occasionnel sur un shift terminé (≈ 1 sur 17).
            if ($estTermine && 0 === $seed % 17) {
                $this->persistPointage($service, $poste, $manager, null, null, Pointage::STATUT_ABSENT, 'Absence non justifiée (no-show)');
                ++$stats['pointages'];
                continue;
            }

            $retard = (0 === $seed % 4) ? 12 : (0 === $seed % 3 ? 6 : 0);
            $arrivee = $shiftStart->modify("+{$retard} minutes");

            // En cours aujourd'hui : arrivé, pas encore parti.
            if ($estAujourdhui && $shiftEnd > $now) {
                $this->persistPointage($service, $poste, $manager, $arrivee, null, Pointage::STATUT_EN_COURS, null);
                ++$stats['pointages'];
                continue;
            }

            $departDelta = (0 === $seed % 2) ? 4 : -8;
            $depart = $shiftEnd->modify(($departDelta >= 0 ? '+' : '').$departDelta.' minutes');
            $pointage = $this->persistPointage($service, $poste, $manager, $arrivee, $depart, Pointage::STATUT_TERMINE, null);
            ++$stats['pointages'];

            // Pause repas au milieu du shift (alignée sur pauseMinutes du poste).
            $pauseMin = $poste->getPauseMinutes();
            if ($pauseMin > 0) {
                $milieuSec = intdiv($shiftEnd->getTimestamp() - $shiftStart->getTimestamp(), 2);
                $pauseStart = $shiftStart->modify("+{$milieuSec} seconds");
                $pause = (new PointagePause())
                    ->setPointage($pointage)
                    ->setType(PointagePause::TYPE_REPAS)
                    ->setHeureDebut($pauseStart)
                    ->setHeureFin($pauseStart->modify("+{$pauseMin} minutes"));
                $this->em->persist($pause);
            }
        }
    }

    private function persistPointage(Service $service, Poste $poste, ?User $manager, ?\DateTimeImmutable $arrivee, ?\DateTimeImmutable $depart, string $statut, ?string $commentaire): Pointage
    {
        $pointage = (new Pointage())
            ->setCentre($service->getCentre())
            ->setService($service)
            ->setPoste($poste)
            ->setUser($poste->getUser())
            ->setHeureArrivee($arrivee)
            ->setHeureDepart($depart)
            ->setStatut($statut)
            ->setCommentaire($commentaire)
            ->setPointePar($manager)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($pointage);

        return $pointage;
    }

    /**
     * Pose une absence crédible sur un employé non planifié ce jour (type tournant).
     *
     * @param User[]                                                                              $employes
     * @param Poste[]                                                                             $postes
     * @param array{centres:int,services:int,postes:int,plannings:int,pointages:int,absences:int} $stats
     */
    private function genererAbsence(Centre $centre, array $employes, array $postes, ?User $manager, \DateTimeImmutable $date, int $dayIndex, array &$stats): void
    {
        $assignedIds = [];
        foreach ($postes as $p) {
            if (null !== $p->getUser()) {
                $assignedIds[$p->getUser()->getId()] = true;
            }
        }
        $off = array_values(array_filter($employes, fn (User $u) => !isset($assignedIds[$u->getId()])));
        if (empty($off)) {
            return;
        }

        $emp = $off[$dayIndex % \count($off)];
        // Évite les doublons (fixtures / rejeu).
        if (null !== $this->em->getRepository(Absence::class)->findOneBy(['centre' => $centre, 'user' => $emp, 'date' => $date])) {
            return;
        }

        $type = self::ABSENCE_SEQ[$dayIndex % \count(self::ABSENCE_SEQ)];
        $motifs = ['MALADIE' => 'Arrêt maladie', 'EVENEMENT_FAMILLE' => 'Événement familial', 'AUTRE' => 'Absence diverse'];
        $absence = (new Absence())
            ->setCentre($centre)
            ->setUser($emp)
            ->setDate($date)
            ->setType($type)
            ->setMotif($motifs[$type] ?? null)
            ->setCreatedBy($manager);
        $this->em->persist($absence);
        ++$stats['absences'];
    }

    private function centreEstOuvert(Centre $centre, \DateTimeImmutable $date): bool
    {
        $hours = $centre->getOpeningHours() ?? [];
        $key = self::DAY_KEYS[(int) $date->format('N')];

        return !empty($hours[$key]['ouvert']);
    }
}

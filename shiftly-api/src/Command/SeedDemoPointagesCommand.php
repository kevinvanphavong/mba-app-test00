<?php

namespace App\Command;

use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\Pointage;
use App\Entity\PointagePause;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\User;
use App\Entity\Zone;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Génère un jeu de données de DÉMO (dev only) : planning (postes) + pointages
 * réalistes pour une semaine et un centre donnés, afin de tester localement la
 * validation hebdo et la correction des pointages.
 *
 * Idempotent : efface puis régénère les pointages du centre/semaine à chaque run
 * (les postes existants sont réutilisés). N'a aucun effet en prod (commande dev).
 */
#[AsCommand(name: 'app:seed-demo-pointages', description: 'Seed planning + pointages de démo (dev)')]
final class SeedDemoPointagesCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('centre', null, InputOption::VALUE_REQUIRED, 'Slug du centre', 'espace-bourges')
            ->addOption('monday', null, InputOption::VALUE_REQUIRED, 'Lundi de la semaine (YYYY-MM-DD). Défaut : lundi de la semaine dernière.')
            ->addOption('showcase', null, InputOption::VALUE_NONE, 'Injecte 2 cas de démo sur le mardi de la semaine : un staff avec plusieurs pauses + un staff en double assignation (2 créneaux/zones).');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $centre = $this->em->getRepository(Centre::class)->findOneBy(['slug' => $input->getOption('centre')]);
        if (!$centre instanceof Centre) {
            $io->error('Centre introuvable : '.$input->getOption('centre'));

            return Command::FAILURE;
        }

        $monday = $input->getOption('monday')
            ? new \DateTimeImmutable($input->getOption('monday'))
            : $this->lastWeekMonday();
        $monday = $monday->setTime(0, 0);

        $employes = $this->em->getRepository(User::class)->findBy(['centre' => $centre, 'role' => 'EMPLOYE', 'actif' => true]);
        $zones = $this->em->getRepository(Zone::class)->findBy(['centre' => $centre], ['ordre' => 'ASC']);
        $manager = $this->em->getRepository(User::class)->findOneBy(['centre' => $centre, 'role' => 'MANAGER', 'actif' => true]);

        if (\count($employes) < 2 || \count($zones) < 1 || !$manager) {
            $io->error('Données insuffisantes (employés / zones / manager) pour ce centre.');

            return Command::FAILURE;
        }

        $sunday = $monday->modify('+6 days');
        $io->section(sprintf('Centre « %s » — semaine du %s au %s', $centre->getNom(), $monday->format('Y-m-d'), $sunday->format('Y-m-d')));

        // Ordre important : pointages (FK → poste) puis postes, puis absences.
        $this->purgeWeekPointages($centre, $monday, $sunday);
        $this->purgeWeekPostes($centre, $monday, $sunday);
        $this->purgeWeekAbsences($centre, $monday, $sunday);

        // Réalisme temporel : on ne pointe pas dans le futur.
        $today = new \DateTimeImmutable('today');
        $now = new \DateTimeImmutable('now');

        $nbPointages = 0;
        $nbNoShows = 0;
        $nbRetards = 0;
        $nbEnCours = 0;
        $absencesParType = [];

        // Séquence d'absences planifiées (REPOS dominant, mais tous les types apparaissent).
        $typeSeq = [
            Absence::TYPES[3], Absence::TYPES[0], Absence::TYPES[3], Absence::TYPES[1], // REPOS, CP, REPOS, RTT
            Absence::TYPES[3], Absence::TYPES[2], Absence::TYPES[3], Absence::TYPES[4], // REPOS, MALADIE, REPOS, EVENEMENT_FAMILLE
            Absence::TYPES[3], Absence::TYPES[5], Absence::TYPES[3], Absence::TYPES[1], // REPOS, AUTRE, REPOS, RTT
            Absence::TYPES[3], Absence::TYPES[2],                                       // REPOS, MALADIE
        ];
        $seqPos = 0;

        for ($d = 0; $d < 7; ++$d) {
            $date = $monday->modify("+{$d} days");
            $isFuture = $date > $today;
            $isToday = $date == $today;
            $statut = $isFuture
                ? Service::STATUT_PLANIFIE
                : ($isToday ? Service::STATUT_EN_COURS : Service::STATUT_TERMINE);
            $service = $this->getOrCreateService($centre, $date, $statut);

            // 5 employés travaillent chaque jour (rotation : 2 en repos, tournant).
            $count = \count($employes);
            $workIdx = [];
            for ($k = 0; $k < min(5, $count); ++$k) {
                $workIdx[] = ($d + $k) % $count;
            }

            // Les employés non planifiés ce jour → vraie absence (repos/CP/RTT/maladie…).
            foreach (array_diff(range(0, $count - 1), $workIdx) as $offIndex) {
                $type = $typeSeq[$seqPos % \count($typeSeq)];
                ++$seqPos;
                $this->createAbsence($centre, $employes[$offIndex], $manager, $date, $type);
                $absencesParType[$type] = ($absencesParType[$type] ?? 0) + 1;
            }

            foreach ($workIdx as $slot => $empIndex) {
                $emp = $employes[$empIndex];
                $zone = $zones[$slot % \count($zones)];

                // Shift alterné matin / soirée selon le jour et le poste.
                [$startH, $endH] = (($d + $slot) % 2 === 0) ? [10, 18] : [15, 23];
                $pauseMin = 30;

                $poste = $this->getOrCreatePoste($service, $zone, $emp, $date, $startH, $endH, $pauseMin);

                // Futur : on s'arrête au planning (poste). On ne pointe jamais dans le futur.
                if ($isFuture) {
                    continue;
                }

                // Aujourd'hui : un shift qui n'a pas encore commencé reste « prévu » (pas de
                // pointage), un shift en cours est EN_COURS (arrivé, pas encore parti).
                $arriveePrevue = $date->setTime($startH, 0);
                if ($isToday && $arriveePrevue > $now) {
                    continue;
                }

                // Scénarios variés pour tester les corrections.
                // No-show : planifié mais absent sans prévenir (≠ absence posée).
                $noShow = (0 === $d && 0 === $slot) || (3 === $d && 1 === $slot);
                if ($noShow) {
                    $this->createPointage($centre, $service, $poste, $emp, $manager, null, null, Pointage::STATUT_ABSENT, 'Absence non justifiée (no-show)');
                    ++$nbNoShows;

                    continue;
                }

                // Retard déterministe sur certains créneaux.
                $retardMin = ((($d * 3) + $slot) % 4 === 0) ? 12 : ((0 === $slot % 3) ? 6 : 0);
                $departDelta = (0 === $slot % 2) ? 4 : -8; // certains partent en avance/retard

                $arrivee = $arriveePrevue->modify("+{$retardMin} minutes");
                $depart = $date->setTime($endH, 0)->modify(($departDelta >= 0 ? '+' : '').$departDelta.' minutes');

                // Aujourd'hui, si le shift n'est pas terminé → pointage EN_COURS (départ ouvert).
                $enCours = $isToday && $depart > $now;
                if ($enCours) {
                    $this->createPointage($centre, $service, $poste, $emp, $manager, $arrivee, null, Pointage::STATUT_EN_COURS, null);
                    ++$nbEnCours;
                    if ($retardMin > 0) {
                        ++$nbRetards;
                    }

                    continue;
                }

                $pointage = $this->createPointage($centre, $service, $poste, $emp, $manager, $arrivee, $depart, Pointage::STATUT_TERMINE, null);
                ++$nbPointages;
                if ($retardMin > 0) {
                    ++$nbRetards;
                }

                // Pause repas au milieu du shift.
                $pauseStart = $date->setTime(intdiv($startH + $endH, 2), 0);
                $pause = (new PointagePause())
                    ->setPointage($pointage)
                    ->setType(PointagePause::TYPE_REPAS)
                    ->setHeureDebut($pauseStart)
                    ->setHeureFin($pauseStart->modify("+{$pauseMin} minutes"));
                $this->em->persist($pause);
            }
        }

        $this->em->flush();

        if ($input->getOption('showcase')) {
            $this->seedShowcase($io, $centre, $monday, $zones, $manager, $today);
        }

        $io->success(sprintf(
            '%d pointages terminés (%d en retard), %d en cours, %d no-show, %d absences posées pour %d employés sur 7 jours.',
            $nbPointages, $nbRetards, $nbEnCours, $nbNoShows, array_sum($absencesParType), \count($employes)
        ));
        $repartition = [];
        foreach ($absencesParType as $type => $n) {
            $repartition[] = "{$type}: {$n}";
        }
        $io->writeln('Absences par type → '.implode(' · ', $repartition));
        $io->writeln('→ Teste la validation/correction sur la semaine du <info>'.$monday->format('Y-m-d').'</info> (module Pointage / Validation hebdo).');

        return Command::SUCCESS;
    }

    /**
     * Injecte deux cas de démo sur le mardi de la semaine (jour passé requis) :
     *   1) un staff avec PLUSIEURS pauses dans la journée (COURTE + REPAS + COURTE) ;
     *   2) un staff en DOUBLE ASSIGNATION le même jour (2 postes, zones + horaires
     *      différents, non chevauchants → vrai créneau coupé).
     *
     * @param Zone[] $zones
     */
    private function seedShowcase(SymfonyStyle $io, Centre $centre, \DateTimeImmutable $monday, array $zones, User $manager, \DateTimeImmutable $today): void
    {
        $day = $monday->modify('+1 days'); // mardi
        if ($day >= $today) {
            $io->warning('Showcase ignoré : le mardi de cette semaine n\'est pas un jour passé (besoin de pointages terminés).');

            return;
        }

        $service = $this->em->getRepository(Service::class)->findOneBy(['centre' => $centre, 'date' => $day]);
        if (!$service instanceof Service) {
            $io->warning('Showcase ignoré : aucun service trouvé pour le '.$day->format('Y-m-d').'.');

            return;
        }

        /** @var Pointage[] $pointages */
        $pointages = $this->em->createQuery(
            'SELECT p FROM App\Entity\Pointage p JOIN p.poste po
             WHERE p.service = :s AND p.statut = :st
             ORDER BY po.heureDebut ASC, p.id ASC'
        )->setParameters(['s' => $service, 'st' => Pointage::STATUT_TERMINE])->getResult();

        if (\count($pointages) < 2) {
            $io->warning('Showcase ignoré : pas assez de pointages terminés le '.$day->format('Y-m-d').'.');

            return;
        }

        // ── Cas 1 : plusieurs pauses ─────────────────────────────────────────
        $p1 = $pointages[0];
        $arrivee = $p1->getHeureArrivee();
        $depart = $p1->getHeureDepart();
        if (null !== $arrivee && null !== $depart) {
            // On repart d'une feuille blanche (suppression effective avant réinsertion).
            $existantes = $this->em->getRepository(PointagePause::class)->findBy(['pointage' => $p1]);
            foreach ($existantes as $oldPause) {
                $this->em->remove($oldPause);
            }
            $this->em->flush();

            // 3 pauses échelonnées, bornées dans la fenêtre arrivée→départ.
            $segments = [
                [PointagePause::TYPE_COURTE, 60, 15],   // pause clope à +1h
                [PointagePause::TYPE_REPAS, 180, 45],   // repas à +3h
                [PointagePause::TYPE_COURTE, 330, 10],  // micro-pause à +5h30
            ];
            foreach ($segments as [$type, $offsetMin, $dureeMin]) {
                $debut = $arrivee->modify("+{$offsetMin} minutes");
                $fin = $debut->modify("+{$dureeMin} minutes");
                if ($fin >= $depart) {
                    continue; // ne déborde pas du shift
                }
                $pause = (new PointagePause())
                    ->setPointage($p1)
                    ->setType($type)
                    ->setHeureDebut($debut)
                    ->setHeureFin($fin);
                $this->em->persist($pause);
            }
        }
        $nomA = trim(($p1->getUser()->getPrenom() ?? '').' '.$p1->getUser()->getNom());

        // ── Cas 2 : double assignation (2 postes / zones / horaires) ─────────
        $p2 = $pointages[1];
        $userB = $p2->getUser();
        $premierPoste = $p2->getPoste();
        $premiereZone = $premierPoste?->getZone();

        // Zone différente de celle du 1er poste.
        $autreZone = null;
        foreach ($zones as $z) {
            if ($z->getId() !== $premiereZone?->getId()) {
                $autreZone = $z;
                break;
            }
        }
        $autreZone ??= $premiereZone;

        // Second créneau non chevauchant : si le 1er est le matin → soirée, sinon matin.
        $premierDebutH = (int) ($premierPoste?->getHeureDebut()?->format('H') ?? 10);
        [$startH, $startM, $endH, $endM] = $premierDebutH < 14
            ? [19, 0, 22, 30]   // 1er shift le matin → 2e en soirée 19h00-22h30
            : [8, 30, 11, 30];  // 1er shift le soir → 2e le matin 08h30-11h30

        if (null !== $autreZone) {
            $secondPoste = (new Poste())
                ->setService($service)
                ->setZone($autreZone)
                ->setUser($userB)
                ->setHeureDebut($day->setTime($startH, $startM))
                ->setHeureFin($day->setTime($endH, $endM))
                ->setPauseMinutes(0);
            $this->em->persist($secondPoste);

            $this->createPointage(
                $centre, $service, $secondPoste, $userB, $manager,
                $day->setTime($startH, $startM)->modify('+3 minutes'),
                $day->setTime($endH, $endM)->modify('-5 minutes'),
                Pointage::STATUT_TERMINE, 'Renfort 2e créneau (démo double assignation)'
            );
        }
        $nomB = trim(($userB->getPrenom() ?? '').' '.$userB->getNom());

        $this->em->flush();

        $io->section('Showcase injecté le '.$day->format('Y-m-d').' (mardi)');
        $io->listing([
            sprintf('Plusieurs pauses : %s (COURTE + REPAS + COURTE)', $nomA),
            sprintf('Double assignation : %s (%s + %s, horaires %02dh%02d→%02dh%02d)', $nomB, $premiereZone?->getNom() ?? '?', $autreZone?->getNom() ?? '?', $startH, $startM, $endH, $endM),
        ]);
        $io->writeln('<comment>Note : la validation hebdo agrège 1 pointage/jour/employé (le 1er). Le 2e créneau de '.$nomB.' apparaît dans le Planning mais n\'est pas additionné dans le total hebdo.</comment>');
    }

    private function lastWeekMonday(): \DateTimeImmutable
    {
        $today = new \DateTimeImmutable('today');
        $dow = (int) $today->format('N');

        return $today->modify('-'.($dow - 1 + 7).' days');
    }

    private function purgeWeekPointages(Centre $centre, \DateTimeImmutable $monday, \DateTimeImmutable $sunday): void
    {
        $pointages = $this->em->createQuery(
            'SELECT p FROM App\Entity\Pointage p JOIN p.service s
             WHERE p.centre = :c AND s.date BETWEEN :from AND :to'
        )->setParameters(['c' => $centre, 'from' => $monday, 'to' => $sunday])->getResult();

        foreach ($pointages as $p) {
            $this->em->remove($p); // pauses supprimées en cascade
        }
        $this->em->flush();
    }

    /**
     * Purge les postes de la semaine pour que le seed soit autoritaire (centre démo).
     * Les pointages doivent être supprimés avant (FK pointage.poste_id).
     */
    private function purgeWeekPostes(Centre $centre, \DateTimeImmutable $monday, \DateTimeImmutable $sunday): void
    {
        $postes = $this->em->createQuery(
            'SELECT p FROM App\Entity\Poste p JOIN p.service s
             WHERE s.centre = :c AND s.date BETWEEN :from AND :to'
        )->setParameters(['c' => $centre, 'from' => $monday, 'to' => $sunday])->getResult();

        foreach ($postes as $p) {
            $this->em->remove($p); // completions supprimées en cascade
        }
        $this->em->flush();
    }

    private function purgeWeekAbsences(Centre $centre, \DateTimeImmutable $monday, \DateTimeImmutable $sunday): void
    {
        $absences = $this->em->createQuery(
            'SELECT a FROM App\Entity\Absence a WHERE a.centre = :c AND a.date BETWEEN :from AND :to'
        )->setParameters(['c' => $centre, 'from' => $monday, 'to' => $sunday])->getResult();

        foreach ($absences as $a) {
            $this->em->remove($a);
        }
        $this->em->flush();
    }

    private function createAbsence(Centre $centre, User $user, User $manager, \DateTimeImmutable $date, string $type): void
    {
        $motifs = [
            'MALADIE' => 'Arrêt maladie',
            'EVENEMENT_FAMILLE' => 'Événement familial',
            'AUTRE' => 'Absence diverse',
        ];

        $absence = (new Absence())
            ->setCentre($centre)
            ->setUser($user)
            ->setDate($date)
            ->setType($type)
            ->setMotif($motifs[$type] ?? null)
            ->setCreatedBy($manager);
        $this->em->persist($absence);
    }

    private function getOrCreateService(Centre $centre, \DateTimeImmutable $date, string $statut): Service
    {
        $service = $this->em->getRepository(Service::class)->findOneBy(['centre' => $centre, 'date' => $date]);
        if ($service instanceof Service) {
            $service->setStatut($statut); // resynchronise le statut (passé/présent/futur) à chaque run

            return $service;
        }

        $service = (new Service())
            ->setCentre($centre)
            ->setDate($date)
            ->setStatut($statut)
            ->setHeureDebut($date->setTime(10, 0))
            ->setHeureFin($date->setTime(23, 0));
        $this->em->persist($service);
        $this->em->flush();

        return $service;
    }

    private function getOrCreatePoste(Service $service, Zone $zone, User $user, \DateTimeImmutable $date, int $startH, int $endH, int $pauseMin): Poste
    {
        $poste = $this->em->getRepository(Poste::class)->findOneBy(['service' => $service, 'zone' => $zone, 'user' => $user]);
        if ($poste instanceof Poste) {
            return $poste;
        }

        $poste = (new Poste())
            ->setService($service)
            ->setZone($zone)
            ->setUser($user)
            ->setHeureDebut($date->setTime($startH, 0))
            ->setHeureFin($date->setTime($endH, 0))
            ->setPauseMinutes($pauseMin);
        $this->em->persist($poste);
        $this->em->flush();

        return $poste;
    }

    private function createPointage(
        Centre $centre,
        Service $service,
        Poste $poste,
        User $user,
        User $manager,
        ?\DateTimeImmutable $arrivee,
        ?\DateTimeImmutable $depart,
        string $statut,
        ?string $commentaire,
    ): Pointage {
        $pointage = (new Pointage())
            ->setCentre($centre)
            ->setService($service)
            ->setPoste($poste)
            ->setUser($user)
            ->setHeureArrivee($arrivee)
            ->setHeureDepart($depart)
            ->setStatut($statut)
            ->setCommentaire($commentaire)
            ->setPointePar($manager)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($pointage);

        return $pointage;
    }
}

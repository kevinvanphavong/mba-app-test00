<?php

namespace App\Command;

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
            ->addOption('centre', null, InputOption::VALUE_REQUIRED, 'Slug du centre', 'speed-park-bourges')
            ->addOption('monday', null, InputOption::VALUE_REQUIRED, 'Lundi de la semaine (YYYY-MM-DD). Défaut : lundi de la semaine dernière.');
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

        $this->purgeWeekPointages($centre, $monday, $sunday);

        $nbPointages = 0;
        $nbAbsences = 0;
        $nbRetards = 0;

        for ($d = 0; $d < 7; ++$d) {
            $date = $monday->modify("+{$d} days");
            $service = $this->getOrCreateService($centre, $date);

            // 5 employés travaillent chaque jour (rotation : 2 en repos, tournant).
            $count = \count($employes);
            $workIdx = [];
            for ($k = 0; $k < min(5, $count); ++$k) {
                $workIdx[] = ($d + $k) % $count;
            }

            foreach ($workIdx as $slot => $empIndex) {
                $emp = $employes[$empIndex];
                $zone = $zones[$slot % \count($zones)];

                // Shift alterné matin / soirée selon le jour et le poste.
                [$startH, $endH] = (($d + $slot) % 2 === 0) ? [10, 18] : [15, 23];
                $pauseMin = 30;

                $poste = $this->getOrCreatePoste($service, $zone, $emp, $date, $startH, $endH, $pauseMin);

                // Scénarios variés pour tester les corrections.
                $absent = (0 === $d && 0 === $slot) || (3 === $d && 1 === $slot); // 2 absences/semaine
                if ($absent) {
                    $this->createPointage($centre, $service, $poste, $emp, $manager, null, null, Pointage::STATUT_ABSENT, 'Absence non justifiée');
                    ++$nbAbsences;

                    continue;
                }

                // Retard déterministe sur certains créneaux.
                $retardMin = ((($d * 3) + $slot) % 4 === 0) ? 12 : ((0 === $slot % 3) ? 6 : 0);
                $departDelta = (0 === $slot % 2) ? 4 : -8; // certains partent en avance/retard

                $arrivee = $date->setTime($startH, 0)->modify("+{$retardMin} minutes");
                $depart = $date->setTime($endH, 0)->modify(($departDelta >= 0 ? '+' : '').$departDelta.' minutes');

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

        $io->success(sprintf(
            '%d pointages terminés (%d en retard) + %d absences générés pour %d employés sur 7 jours.',
            $nbPointages, $nbRetards, $nbAbsences, \count($employes)
        ));
        $io->writeln('→ Teste la validation/correction sur la semaine du <info>'.$monday->format('Y-m-d').'</info> (module Pointage / Validation hebdo).');

        return Command::SUCCESS;
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

    private function getOrCreateService(Centre $centre, \DateTimeImmutable $date): Service
    {
        $service = $this->em->getRepository(Service::class)->findOneBy(['centre' => $centre, 'date' => $date]);
        if ($service instanceof Service) {
            return $service;
        }

        $service = (new Service())
            ->setCentre($centre)
            ->setDate($date)
            ->setStatut(Service::STATUT_TERMINE)
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

<?php

namespace App\Command;

use App\Entity\Plan;
use App\Repository\PlanRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Seed IDEMPOTENT des deux plans agence qui évitent le DOUBLE ESSAI :
 *  - « Pro essai 14j » (joursEssai=14) : prospect qui souscrit sans essai accompagné.
 *  - « Pro sans essai » (joursEssai=0) : client ayant déjà fait l'essai accompagné → encaisse direct.
 *
 * Upsert par `cle` (identité stable) : deux exécutions donnent le même état. Ne touche
 * jamais aux références Stripe des plans (stripeProductId/PriceId), gérées par le gateway.
 */
#[AsCommand(name: 'app:billing:seed:plans', description: 'Seed idempotent des 2 plans agence (essai 14j / sans essai)')]
final class BillingSeedPlansCommand extends Command
{
    /** Montant commun : même offre, seul l'essai diffère. */
    private const PRIX_CENTS = 9900;

    /** @var list<array{cle: string, nom: string, joursEssai: int}> */
    private const PLANS = [
        ['cle' => 'pro_essai_14j', 'nom' => 'Pro essai 14j', 'joursEssai' => 14],
        ['cle' => 'pro_sans_essai', 'nom' => 'Pro sans essai', 'joursEssai' => 0],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PlanRepository $plans,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        foreach (self::PLANS as $def) {
            $plan = $this->plans->findOneBy(['cle' => $def['cle']]) ?? new Plan();
            $existe = null !== $plan->getId();

            $plan
                ->setNom($def['nom'])
                ->setCle($def['cle'])
                ->setPrixMensuelCents(self::PRIX_CENTS)
                ->setJoursEssai($def['joursEssai'])
                ->setActif(true);

            $this->em->persist($plan);
            $io->writeln(sprintf('%s %s (%s) — essai %d j', $existe ? 'maj' : 'créé', $def['nom'], $def['cle'], $def['joursEssai']));
        }

        $this->em->flush();
        $io->success('Plans agence essai/sans-essai à jour (idempotent).');

        return Command::SUCCESS;
    }
}

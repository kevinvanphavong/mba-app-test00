<?php

namespace App\Command;

use App\Entity\Avis;
use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use App\Entity\Invoice;
use App\Entity\Plan;
use App\Entity\Prestation;
use App\Entity\Relance;
use App\Entity\Reservation;
use App\Entity\Subscription;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Seed de démo SUPER-ADMIN — ADDITIF et IDEMPOTENT. S'appuie sur les centres existants
 * pour peupler les vues super-admin : plans + abonnements + factures (Stripe simulé,
 * ids `*_demo_*`, ZÉRO réseau), contacts, avis, relances, demandes/devis, réservations.
 *
 * NE passe PAS par PlanAssignmentService (qui appellerait le vrai gateway Stripe) : les
 * entités Subscription/Invoice sont créées directement avec des identifiants factices.
 *
 * Rejouable : deux exécutions donnent le même état (garde-fous par centre). Refuse en
 * prod (`APP_ENV=prod`) sans `--force`.
 */
#[AsCommand(name: 'app:demo:seed:superadmin', description: 'Seed additif idempotent : peuple les vues super-admin (abonnements, factures, avis, relances, demandes, réservations)')]
final class DemoSeedSuperAdminCommand extends Command
{
    /** Catalogue de plans de démo (créés s'ils manquent). Montants en centimes. */
    private const PLANS = [
        ['nom' => 'Pack Web', 'cle' => 'pack_web', 'prix' => 4900],
        ['nom' => 'Pack Complet', 'cle' => 'pack_complet', 'prix' => 9900],
        ['nom' => 'Pack Équipe', 'cle' => 'pack_equipe', 'prix' => 14900],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        #[Autowire('%kernel.environment%')]
        private readonly string $kernelEnv,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('force', null, InputOption::VALUE_NONE, 'Obligatoire en prod pour autoriser l\'écriture de données de démo.')
            ->addOption('skip-centre', null, InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY, 'Slug d\'un centre à laisser intact (répétable). Utile pour un centre présenté à un vrai prospect, à qui on ne veut ni abonnement ni CRM générique.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ('prod' === $this->kernelEnv && !$input->getOption('force')) {
            $io->error('APP_ENV=prod : refus d\'écrire des données de démo. Relance avec --force si c\'est volontaire.');

            return Command::FAILURE;
        }

        $io->title('Seed démo super-admin (additif, idempotent)');

        $plans = $this->ensurePlans();
        $stats = ['centres' => 0, 'subscriptions' => 0, 'invoices' => 0, 'avis' => 0, 'relances' => 0, 'demandes' => 0, 'reservations' => 0];

        /** @var list<string> $ignores */
        $ignores = $input->getOption('skip-centre');

        foreach ($this->em->getRepository(Centre::class)->findAll() as $centre) {
            if (\in_array((string) $centre->getSlug(), $ignores, true)) {
                $io->writeln(sprintf('  – %s — ignoré (--skip-centre)', $centre->getNom()));
                continue;
            }

            $manager = $this->em->getRepository(User::class)->findOneBy(['centre' => $centre, 'role' => User::ROLE_MANAGER, 'actif' => true]);
            if (null === $manager) {
                continue; // centre sans gérant actif : hors périmètre de la démo agence
            }

            $plan = $plans[$centre->getId() % \count($plans)];
            $centre->setPlan($plan)->setAbonnementMensuelCents($plan->getPrixMensuelCents());
            $impaye = 0 === $centre->getId() % 2; // moitié des centres : dernière facture en échec (variété)

            $this->ensureSubscription($centre, $plan, $impaye, $stats);
            $this->ensureInvoices($centre, $plan->getPrixMensuelCents(), $impaye, $stats);
            $contact = $this->ensureContact($centre);
            $this->ensureAvis($centre, $contact, $stats);
            $this->ensureRelance($centre, $contact, $stats);
            $this->ensureDemandeDevis($centre, $stats);
            $this->ensureReservations($centre, $stats);

            ++$stats['centres'];
            $io->writeln(sprintf('  ✓ %s — plan %s', $centre->getNom(), $plan->getNom()));
        }

        $this->em->flush();

        $io->section('Peuplement');
        $io->definitionList(
            ['Centres traités' => $stats['centres']],
            ['Abonnements' => $stats['subscriptions']],
            ['Factures' => $stats['invoices']],
            ['Avis' => $stats['avis']],
            ['Relances' => $stats['relances']],
            ['Demandes + devis' => $stats['demandes']],
            ['Réservations' => $stats['reservations']],
        );
        $io->success('Vues super-admin peuplées : /superadmin/console · /subscriptions · /billing · CRM.');

        return Command::SUCCESS;
    }

    /** @return list<Plan> */
    private function ensurePlans(): array
    {
        $plans = [];
        foreach (self::PLANS as $p) {
            $plan = $this->em->getRepository(Plan::class)->findOneBy(['cle' => $p['cle']])
                ?? (new Plan())->setCle($p['cle']);
            $plan->setNom($p['nom'])->setPrixMensuelCents($p['prix'])->setActif(true);
            $this->em->persist($plan);
            $plans[] = $plan;
        }

        return $plans;
    }

    /** @param array<string, int> $stats */
    private function ensureSubscription(Centre $centre, Plan $plan, bool $impaye, array &$stats): void
    {
        $sub = $this->em->getRepository(Subscription::class)->findOneBy(['centre' => $centre])
            ?? (new Subscription())->setCentre($centre);
        if (null === $sub->getId()) {
            ++$stats['subscriptions'];
        }
        $sub->setPlan($plan)
            ->setStripeCustomerId('cus_demo_'.$centre->getId())
            ->setStripeSubscriptionId('sub_demo_'.$centre->getId())
            ->setStatut($impaye ? Subscription::STATUT_PAST_DUE : Subscription::STATUT_ACTIVE)
            ->setMontantCents($plan->getPrixMensuelCents());
        $this->em->persist($sub);
    }

    /** @param array<string, int> $stats */
    private function ensureInvoices(Centre $centre, int $montant, bool $impaye, array &$stats): void
    {
        // 3 factures : les deux premières payées, la 3e en échec si le centre est « impayé ».
        foreach ([1, 2, 3] as $n) {
            $ref = sprintf('in_demo_%d_%d', $centre->getId(), $n);
            if (null !== $this->em->getRepository(Invoice::class)->findOneBy(['stripeInvoiceId' => $ref])) {
                continue;
            }
            $statut = (3 === $n && $impaye) ? Invoice::STATUT_FAILED : Invoice::STATUT_PAID;
            $facture = (new Invoice())->setCentre($centre)->setStripeInvoiceId($ref)->setMontantCents($montant)->setStatut($statut);
            $this->em->persist($facture);
            ++$stats['invoices'];
        }
    }

    private function ensureContact(Centre $centre): Contact
    {
        $existant = $this->em->getRepository(Contact::class)->findOneBy(['centre' => $centre]);
        if (null !== $existant) {
            return $existant;
        }
        $contact = (new Contact())
            ->setCentre($centre)
            ->setNom('Client Démo')
            ->setEmail(sprintf('client-demo-%d@exemple.fr', $centre->getId()))
            ->setEmailHash('demo-hash-'.$centre->getId())
            ->setSegments([Contact::SEGMENT_B2C, Contact::SEGMENT_NO_SHOW]);
        $this->em->persist($contact);

        return $contact;
    }

    /** @param array<string, int> $stats */
    private function ensureAvis(Centre $centre, Contact $contact, array &$stats): void
    {
        if ($this->em->getRepository(Avis::class)->count(['centre' => $centre]) >= 2) {
            return;
        }
        $seed = [
            [5, 'Super expérience, on reviendra !', Avis::STATUT_REPONDU, 'Merci beaucoup, à bientôt !'],
            [3, 'Correct mais un peu d\'attente à l\'accueil.', Avis::STATUT_NOUVEAU, null],
        ];
        foreach ($seed as [$note, $commentaire, $statut, $reponse]) {
            $avis = (new Avis())->setCentre($centre)->setContact($contact)->setNote($note)->setCommentaire($commentaire)->setStatut($statut);
            if (null !== $reponse) {
                $avis->setReponse($reponse);
            }
            $this->em->persist($avis);
            ++$stats['avis'];
        }
    }

    /** @param array<string, int> $stats */
    private function ensureRelance(Centre $centre, Contact $contact, array &$stats): void
    {
        if ($this->em->getRepository(Relance::class)->count(['centre' => $centre]) >= 1) {
            return;
        }
        $relance = (new Relance())->setCentre($centre)->setContact($contact)
            ->setMotif(Relance::MOTIF_NO_SHOW)
            ->setTexte('Bonjour, nous avons remarqué votre absence. Souhaitez-vous reprogrammer ?')
            ->setStatut(Relance::STATUT_A_ENVOYER);
        $this->em->persist($relance);
        ++$stats['relances'];
    }

    /** @param array<string, int> $stats */
    private function ensureDemandeDevis(Centre $centre, array &$stats): void
    {
        if ($this->em->getRepository(DemandeB2B::class)->count(['centre' => $centre]) >= 1) {
            return;
        }
        $demande = (new DemandeB2B())->setCentre($centre)
            ->setNomContact('Société Démo')->setEmail(sprintf('b2b-demo-%d@exemple.fr', $centre->getId()))->setTelephone('0600000000')
            ->setSociete('Démo SARL')->setTypeEvenement('Séminaire d\'équipe')->setNbPersonnes(20)
            ->setMessage('Nous cherchons un lieu pour un séminaire d\'une vingtaine de personnes.')
            ->setStatut(DemandeB2B::STATUT_EN_COURS);
        $this->em->persist($demande);

        $devis = (new Devis())->setCentre($centre)->setDemande($demande)
            ->setLignes([
                ['designation' => 'Privatisation 2h', 'quantite' => 1, 'prixUnitaireCents' => 50000, 'montantCents' => 50000],
                ['designation' => 'Formule repas', 'quantite' => 20, 'prixUnitaireCents' => 2500, 'montantCents' => 50000],
            ])
            ->setTotalCents(100000)->setStatut(Devis::STATUT_ENVOYE);
        $this->em->persist($devis);
        ++$stats['demandes'];
    }

    /** @param array<string, int> $stats */
    private function ensureReservations(Centre $centre, array &$stats): void
    {
        $prestation = $this->em->getRepository(Prestation::class)->findOneBy(['centre' => $centre, 'actif' => true]);
        if (null === $prestation || $this->em->getRepository(Reservation::class)->count(['centre' => $centre]) >= 2) {
            return; // besoin d'une prestation active ; idempotent si déjà 2 résas
        }
        foreach ([[2, 15], [4, 40]] as $i => [$nb, $joursAvant]) {
            $total = $prestation->getPrixCents() * $nb;
            $resa = (new Reservation())->setCentre($centre)->setPrestation($prestation)
                ->setDateCreneau(new \DateTimeImmutable(sprintf('+%d days 18:00', $joursAvant)))
                ->setNbPersonnes($nb)->setNomInvite('Invité Démo '.($i + 1))->setEmailInvite(sprintf('invite-%d-%d@exemple.fr', $centre->getId(), $i))
                ->setTelephoneInvite('0600000000')
                ->setMontantTotalCents($total)->setAcompteCents((int) round($total * 0.3))
                ->setStatut(Reservation::STATUT_CONFIRMEE);
            $this->em->persist($resa);
            ++$stats['reservations'];
        }
    }
}

<?php

namespace App\Command;

use App\Entity\Centre;
use App\Entity\Prestation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Seed de démo PUBLIC — ADDITIF et IDEMPOTENT (n'efface rien, contrairement à
 * `app:demo:seed`). Pose 2 centres testables en local par domaine (`*.localhost`)
 * avec contenu de site, prestations, un gérant et un abonnement (MRR), plus un
 * super-admin de démo. Rejouable : deux exécutions donnent le même état, sans doublon.
 *
 * ⚠️ En prod (`APP_ENV=prod`), refuse de s'exécuter sans `--force`.
 *
 * Mots de passe de DÉMO simples, connus et imprimés dans le récap (jamais ailleurs).
 */
#[AsCommand(name: 'app:demo:seed:public', description: 'Seed additif idempotent : 2 centres de démo publics (*.localhost) + gérants + super-admin')]
final class DemoSeedPublicCommand extends Command
{
    /** Mot de passe de démo commun aux gérants et au super-admin. */
    private const DEMO_PASSWORD = 'demo1234';

    private const SUPERADMIN_EMAIL = 'superadmin@demo.test';

    /** Ports de dev local (front Next / API Symfony). */
    private const FRONT_PORT = 3000;
    private const API_PORT = 8000;

    /**
     * Configuration déterministe des centres de démo. Montants en CENTIMES.
     *
     * @var list<array{nom: string, slug: string, domaine: string, hero: string, sousTitre: string, description: string, abonnement: int, adresse: string, telephone: string, manager: array{email: string, nom: string, prenom: string}, prestations: list<array{0: string, 1: int}>}>
     */
    private const CENTRES = [
        [
            'nom' => 'VR Galaxie Nantes',
            'slug' => 'vr-galaxie-nantes',
            'domaine' => 'vrgalaxie.localhost',
            'hero' => 'VR Galaxie — plongez dans l\'arcade du futur',
            'sousTitre' => 'Réalité virtuelle en salle, à Nantes',
            'description' => 'Salles de réalité virtuelle multijoueur, escape games immersifs et anniversaires : réservez votre session en quelques secondes.',
            'abonnement' => 40000,
            'adresse' => '12 rue des Olivettes, 44000 Nantes',
            'telephone' => '02 40 00 00 01',
            'manager' => ['email' => 'manager@vrgalaxie.test', 'nom' => 'Martin', 'prenom' => 'Léa'],
            'prestations' => [
                ['Session VR 30 minutes', 1500],
                ['Session VR 1 heure', 2500],
                ['Escape game VR (équipe)', 3200],
                ['Anniversaire VR (groupe)', 12000],
            ],
        ],
        [
            'nom' => 'Bowling de Tours',
            'slug' => 'bowling-de-tours',
            'domaine' => 'bowling.localhost',
            'hero' => 'Bowling de Tours — strike garanti',
            'sousTitre' => 'Pistes, bar et restauration au centre-ville',
            'description' => 'Douze pistes de bowling, un bar à cocktails et une carte de burgers maison. Réservez votre piste et votre créneau en ligne.',
            'abonnement' => 35000,
            'adresse' => '5 place Jean Jaurès, 37000 Tours',
            'telephone' => '02 47 00 00 02',
            'manager' => ['email' => 'manager@bowling.test', 'nom' => 'Dubois', 'prenom' => 'Karim'],
            'prestations' => [
                ['Partie de bowling', 700],
                ['Location de chaussures', 200],
                ['Formule bowling + burger', 1800],
                ['Piste privatisée 1 heure', 4500],
            ],
        ],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        #[Autowire('%kernel.environment%')]
        private readonly string $kernelEnv,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Obligatoire en prod pour autoriser l\'écriture de données de démo.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // ── Garde-fou prod : jamais de données de démo en prod par accident ──
        if ('prod' === $this->kernelEnv && !$input->getOption('force')) {
            $io->error('APP_ENV=prod : refus d\'écrire des données de démo. Relance avec --force si c\'est volontaire.');

            return Command::FAILURE;
        }

        $io->title('Seed démo public (additif, idempotent)');

        /** @var array<int, array{centre: Centre, manager: User, config: array<string, mixed>}> $recap */
        $recap = [];
        $premierCentre = null;

        foreach (self::CENTRES as $config) {
            $centre = $this->upsertCentre($config);
            $premierCentre ??= $centre;
            $this->upsertPrestations($centre, $config['prestations']);
            $manager = $this->upsertManager($centre, $config['manager']);
            $recap[] = ['centre' => $centre, 'manager' => $manager, 'config' => $config];
            $io->writeln(sprintf('  ✓ %s (%s) — %d prestations, gérant %s', $config['nom'], $config['domaine'], \count($config['prestations']), $config['manager']['email']));
        }

        // Super-admin de démo (rattaché à un centre : User.centre est NOT NULL).
        $superadmin = $this->upsertSuperadmin($premierCentre);
        $io->writeln(sprintf('  ✓ super-admin de démo : %s', $superadmin->getEmail()));

        $this->em->flush();

        $this->afficherRecap($io, $recap);

        return Command::SUCCESS;
    }

    /** @param array{nom: string, slug: string, domaine: string, hero: string, sousTitre: string, description: string, abonnement: int, adresse: string, telephone: string} $c */
    private function upsertCentre(array $c): Centre
    {
        // Clé d'idempotence : le domaine (unique). À défaut, le slug.
        $centre = $this->em->getRepository(Centre::class)->findOneBy(['domaine' => $c['domaine']])
            ?? $this->em->getRepository(Centre::class)->findOneBy(['slug' => $c['slug']])
            ?? new Centre();

        $centre
            ->setNom($c['nom'])
            ->setSlug($c['slug'])
            ->setDomaine($c['domaine'])
            ->setAdresse($c['adresse'])
            ->setTelephone($c['telephone'])
            ->setActif(true)
            ->setAbonnementMensuelCents($c['abonnement'])
            ->setSiteHeroTitre($c['hero'])
            ->setSiteHeroSousTitre($c['sousTitre'])
            ->setSiteDescription($c['description']);

        $this->em->persist($centre);

        return $centre;
    }

    /** @param list<array{0: string, 1: int}> $prestations */
    private function upsertPrestations(Centre $centre, array $prestations): void
    {
        foreach ($prestations as $ordre => [$nom, $prixCents]) {
            $presta = $this->em->getRepository(Prestation::class)->findOneBy(['centre' => $centre, 'nom' => $nom])
                ?? (new Prestation())->setCentre($centre);

            $presta->setNom($nom)->setPrixCents($prixCents)->setOrdre($ordre)->setActif(true);
            $this->em->persist($presta);
        }
    }

    /** @param array{email: string, nom: string, prenom: string} $m */
    private function upsertManager(Centre $centre, array $m): User
    {
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $m['email']]) ?? new User();

        $user->setCentre($centre)
            ->setEmail($m['email'])
            ->setNom($m['nom'])
            ->setPrenom($m['prenom'])
            ->setRole(User::ROLE_MANAGER)
            ->setActif(true);
        // Mot de passe de démo (re)posé à chaque exécution → l'accès démo reste garanti.
        $user->setPassword($this->hasher->hashPassword($user, self::DEMO_PASSWORD));

        $this->em->persist($user);

        return $user;
    }

    private function upsertSuperadmin(Centre $centreParDefaut): User
    {
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => self::SUPERADMIN_EMAIL]) ?? new User();

        if (null === $user->getCentre()) {
            $user->setCentre($centreParDefaut);
        }
        $user->setEmail(self::SUPERADMIN_EMAIL)
            ->setNom('Démo')
            ->setPrenom('Super Admin')
            ->setRole(User::ROLE_SUPERADMIN)
            ->setActif(true);
        $user->setPassword($this->hasher->hashPassword($user, self::DEMO_PASSWORD));

        $this->em->persist($user);

        return $user;
    }

    /** @param array<int, array{centre: Centre, manager: User, config: array<string, mixed>}> $recap */
    private function afficherRecap(SymfonyStyle $io, array $recap): void
    {
        $io->section('Récap — URLs de test & identifiants (démo local)');

        foreach ($recap as $r) {
            $c = $r['config'];
            $io->writeln(sprintf('<info>%s</info>', $c['nom']));
            $io->listing([
                sprintf('Site public (front)   : http://%s:%d/site', $c['domaine'], self::FRONT_PORT),
                sprintf('Site public (API host): http://%s:%d/api/public/site', $c['domaine'], self::API_PORT),
                sprintf('Cockpit gérant        : http://localhost:%d/login', self::FRONT_PORT),
                sprintf('Identifiants gérant   : %s / %s', $c['manager']['email'], self::DEMO_PASSWORD),
            ]);
        }

        $io->writeln('<info>Console super-admin</info>');
        $io->listing([
            sprintf('Console               : http://localhost:%d/superadmin', self::FRONT_PORT),
            sprintf('Identifiants          : %s / %s', self::SUPERADMIN_EMAIL, self::DEMO_PASSWORD),
        ]);

        $io->note([
            'Les domaines *.localhost résolvent vers 127.0.0.1 nativement (aucun /etc/hosts requis).',
            'Le site public résout le centre par le HOST vu par l\'API : la variante « API host » ci-dessus le démontre directement.',
            'Pour que le front :3000 résolve par sous-domaine, servir l\'API sur le même host (NEXT_PUBLIC_API_URL = http://<domaine>:'.self::API_PORT.'/api).',
        ]);
    }
}

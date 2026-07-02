<?php

namespace App\Service;

use App\Dto\CreateClientInput;
use App\Entity\Centre;
use App\Entity\User;
use App\Exception\ClientConflitException;
use App\Repository\CentreRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\String\Slugger\SluggerInterface;

/**
 * Onboarding d'un nouveau client par le super-admin : crée un {@see Centre} isolé
 * (domaine unique) + son gérant {@see User} MANAGER, en UNE transaction (aucun centre
 * à moitié créé en cas d'erreur). Le domaine est normalisé (minuscules, sans www/port)
 * et son unicité vérifiée ; le mot de passe est hashé, jamais loggé.
 *
 * Réservé au super-admin (contrôlé au niveau firewall/contrôleur). La création ne
 * touche AUCUNE donnée d'un autre centre.
 */
final class ClientOnboardingService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CentreRepository $centres,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly SluggerInterface $slugger,
    ) {
    }

    public function creerClient(CreateClientInput $input): Centre
    {
        $domaine = CurrentCentreResolver::normalizeHost((string) $input->domaine);
        if ('' === $domaine) {
            throw new ClientConflitException('Domaine invalide.');
        }
        if (null !== $this->centres->findOneByDomaine($domaine)) {
            throw new ClientConflitException('Ce domaine est déjà attribué à un autre centre.');
        }

        $email = mb_strtolower(trim((string) $input->managerEmail));
        if (null !== $this->users->findOneBy(['email' => $email])) {
            throw new ClientConflitException('Cet email de gérant est déjà utilisé.');
        }

        $centre = (new Centre())
            ->setNom((string) $input->nom)
            ->setSlug($this->slugUnique((string) $input->nom))
            ->setDomaine($domaine)
            ->setActif(true)
            ->setAbonnementMensuelCents((int) $input->abonnementMensuelCents)
            ->setSiteHeroTitre((string) $input->nom)
            ->setSiteHeroSousTitre('Réservez en ligne')
            ->setSiteDescription('Bienvenue chez '.$input->nom.'.');

        $manager = (new User())
            ->setCentre($centre)
            ->setNom((string) $input->managerNom)
            ->setEmail($email)
            ->setRole(User::ROLE_MANAGER)
            ->setActif(true);
        $manager->setPassword($this->hasher->hashPassword($manager, (string) $input->managerMotDePasse));

        // Transaction : centre + gérant créés ensemble, ou rien (pas de centre orphelin).
        $this->em->wrapInTransaction(function () use ($centre, $manager): void {
            $this->em->persist($centre);
            $this->em->persist($manager);
        });

        return $centre;
    }

    /** Slug lisible et UNIQUE dérivé du nom (suffixe -N si déjà pris). */
    private function slugUnique(string $nom): string
    {
        $base = strtolower($this->slugger->slug($nom)->toString());
        if ('' === $base) {
            $base = 'centre';
        }

        $slug = $base;
        $n = 1;
        while (null !== $this->centres->findOneBy(['slug' => $slug])) {
            $slug = $base.'-'.(++$n);
        }

        return $slug;
    }
}

<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\User;
use App\Exception\ClientConflitException;
use App\Repository\CentreRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Pilotage d'un client existant par le super-admin (logique métier hors contrôleur) :
 * changement de domaine (normalisé + unique globalement) et reset du mot de passe du
 * gérant (hashé, jamais loggé ni renvoyé en clair).
 */
final class ClientManagementService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CentreRepository $centres,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
    }

    /**
     * Seam UNIQUE de suspension : coupe l'accès (site public + cockpit via
     * {@see \App\Security\CentreActifUserChecker}). Idempotent (déjà suspendu = no-op).
     * Utilisé par le super-admin (manuel) ET par l'impayé Stripe (webhook).
     */
    public function suspendre(Centre $centre): void
    {
        $this->basculerActif($centre, false);
    }

    /** Seam UNIQUE de réactivation : rétablit l'accès. Idempotent. */
    public function reactiver(Centre $centre): void
    {
        $this->basculerActif($centre, true);
    }

    /**
     * (Re)génère la clé API d'ingestion du centre (token aléatoire fort). Retourne la
     * clé en clair (à communiquer une fois au système émetteur, ex. FGC). Régénérer
     * invalide immédiatement l'ancienne clé.
     */
    public function regenererIngestKey(Centre $centre): string
    {
        $key = bin2hex(random_bytes(24)); // 48 hex chars
        $centre->setIngestKey($key);
        $this->em->flush();

        return $key;
    }

    private function basculerActif(Centre $centre, bool $actif): void
    {
        if ($centre->isActif() === $actif) {
            return;
        }
        $centre->setActif($actif);
        $this->em->flush();
    }

    /**
     * Change le domaine d'un centre. Normalisé (minuscules, sans www/port) puis vérifié
     * unique : un domaine n'appartient qu'à UN centre — refus s'il est pris par un autre.
     */
    public function changerDomaine(Centre $centre, string $domaine): void
    {
        $domaine = CurrentCentreResolver::normalizeHost($domaine);
        if ('' === $domaine) {
            throw new ClientConflitException('Domaine invalide.');
        }

        $existant = $this->centres->findOneByDomaine($domaine);
        if (null !== $existant && $existant->getId() !== $centre->getId()) {
            throw new ClientConflitException('Ce domaine est déjà attribué à un autre centre.');
        }

        $centre->setDomaine($domaine);
        $this->em->flush();
    }

    /**
     * Réinitialise le mot de passe du premier gérant actif du centre (même convention
     * que l'impersonation). Le mot de passe est hashé ; il n'est jamais loggé ni renvoyé.
     * Retourne le gérant concerné (pour afficher SON email, pas de mot de passe).
     */
    public function resetMotDePasseGerant(Centre $centre, string $nouveauMotDePasse): User
    {
        $manager = $this->users->findOneBy(['centre' => $centre, 'role' => User::ROLE_MANAGER, 'actif' => true]);
        if (null === $manager) {
            throw new ClientConflitException('Aucun gérant actif sur ce centre.');
        }

        $manager->setPassword($this->hasher->hashPassword($manager, $nouveauMotDePasse));
        $this->em->flush();

        return $manager;
    }
}

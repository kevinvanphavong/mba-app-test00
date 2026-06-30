<?php

namespace App\Repository;

use App\Entity\Centre;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CentreRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Centre::class);
    }

    public function findBySlug(string $slug): ?Centre
    {
        return $this->findOneBy(['slug' => $slug]);
    }

    /**
     * Résolution publique du tenant : un host (domaine) → son centre.
     * Retourne null si aucun centre ne revendique ce domaine.
     */
    public function findOneByDomaine(string $domaine): ?Centre
    {
        return $this->findOneBy(['domaine' => $domaine]);
    }
}

<?php

namespace App\Repository;

use App\Entity\Centre;
use App\Entity\Contact;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Contact>
 */
class ContactRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Contact::class);
    }

    /**
     * Contact d'un centre par le hash déterministe de son email — clé de dédup.
     * Recherche sur le hash (jamais l'email en clair), bornée au centre : un même
     * email dans deux centres = deux contacts distincts (isolation).
     */
    public function findOneByCentreAndEmailHash(Centre $centre, string $emailHash): ?Contact
    {
        return $this->findOneBy(['centre' => $centre, 'emailHash' => $emailHash]);
    }
}

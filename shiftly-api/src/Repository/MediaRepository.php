<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Media;
use App\Enum\MediaEntityType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Media>
 */
class MediaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Media::class);
    }

    /**
     * Liste les Media attachés à une entité parente, filtrés par centre (multi-tenant).
     *
     * @return Media[]
     */
    public function findByEntity(MediaEntityType $type, int $entityId, int $centreId): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.entityType = :type')
            ->andWhere('m.entityId = :entityId')
            ->andWhere('m.centre = :centreId')
            ->setParameter('type', $type)
            ->setParameter('entityId', $entityId)
            ->setParameter('centreId', $centreId)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Liste les Media attachés à une entité parente, sans filtrage centre
     * (utilisé par les EntityListener de cleanup où le centre est déjà connu
     * via l'entité parente elle-même).
     *
     * @return Media[]
     */
    public function findAllByEntity(MediaEntityType $type, int $entityId): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.entityType = :type')
            ->andWhere('m.entityId = :entityId')
            ->setParameter('type', $type)
            ->setParameter('entityId', $entityId)
            ->getQuery()
            ->getResult();
    }
}

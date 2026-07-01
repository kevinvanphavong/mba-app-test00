<?php

namespace App\Entity;

use App\Repository\IaUsageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Journal d'une consommation IA réussie (audit / facturation) : quel centre, quel
 * usage, quand. Une ligne par appel abouti. Distinct du compteur agrégé
 * {@see IaQuota} : ici on garde la trace fine, là on plafonne.
 *
 * Isolation tenant : `centre` non nul. Non exposée via API Platform.
 */
#[ORM\Entity(repositoryClass: IaUsageRepository::class)]
#[ORM\Table(name: 'ia_usage')]
#[ORM\Index(name: 'idx_ia_usage_centre', columns: ['centre_id'])]
class IaUsage
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    /** Étiquette d'usage (ex. « devis », « crm », « generic ») — pour l'audit. */
    #[ORM\Column(name: 'usage_type', length: 60)]
    private string $usage;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(Centre $centre, string $usage)
    {
        $this->centre = $centre;
        $this->usage = $usage;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCentre(): ?Centre
    {
        return $this->centre;
    }

    public function getUsage(): string
    {
        return $this->usage;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}

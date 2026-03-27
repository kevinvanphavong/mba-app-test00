<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\ZoneRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ZoneRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_zone_centre_nom', columns: ['centre_id', 'nom'])]
#[ApiResource(
    normalizationContext:   ['groups' => ['zone:read']],
    denormalizationContext: ['groups' => ['zone:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER')"),
        new Post(security:          "is_granted('ROLE_MANAGER')"),
        new Put(security:           "is_granted('ROLE_MANAGER')"),
        new Delete(security:        "is_granted('ROLE_MANAGER')"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['nom' => 'partial', 'centre' => 'exact'])]
#[ApiFilter(OrderFilter::class,  properties: ['ordre', 'nom'])]
class Zone
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['zone:read', 'mission:read', 'poste:read', 'competence:read', 'service:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class, inversedBy: 'zones')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['zone:read', 'zone:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['zone:read', 'zone:write', 'mission:read', 'poste:read', 'competence:read', 'service:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['zone:read', 'zone:write', 'mission:read', 'poste:read', 'competence:read', 'service:read'])]
    private ?string $couleur = null;

    #[ORM\Column]
    #[Groups(['zone:read', 'zone:write'])]
    private int $ordre = 0;

    #[ORM\OneToMany(mappedBy: 'zone', targetEntity: Mission::class, cascade: ['remove'])]
    private Collection $missions;

    #[ORM\OneToMany(mappedBy: 'zone', targetEntity: Competence::class, cascade: ['remove'])]
    private Collection $competences;

    public function __construct()
    {
        $this->missions    = new ArrayCollection();
        $this->competences = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $c): static { $this->centre = $c; return $this; }
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getCouleur(): ?string { return $this->couleur; }
    public function setCouleur(?string $c): static { $this->couleur = $c; return $this; }
    public function getOrdre(): int { return $this->ordre; }
    public function setOrdre(int $ordre): static { $this->ordre = $ordre; return $this; }
    public function getMissions(): Collection { return $this->missions; }
    public function getCompetences(): Collection { return $this->competences; }
}

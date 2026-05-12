<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\MissionCategorieRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Catalogue administrable des catégories de mission par centre.
 *
 * Chaque centre dispose de sa propre liste (multi-tenant). Le champ Mission::categorie
 * conserve un slug texte qui matche `MissionCategorie::nom` côté lookup front
 * pour récupérer couleur/icône/ordre lors de l'affichage. Pas de FK stricte pour
 * éviter la migration intrusive sur les missions existantes — le slug texte sert
 * de référence faible.
 */
#[ORM\Entity(repositoryClass: MissionCategorieRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_mission_cat_centre_nom', columns: ['centre_id', 'nom'])]
#[ApiResource(
    shortName: 'MissionCategorie',
    normalizationContext:   ['groups' => ['mission_categorie:read']],
    denormalizationContext: ['groups' => ['mission_categorie:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER')"),
        new Post(security:          "is_granted('ROLE_MANAGER')"),
        new Put(security:           "is_granted('ROLE_MANAGER')"),
        new Patch(security:         "is_granted('ROLE_MANAGER')"),
        new Delete(security:        "is_granted('ROLE_MANAGER')"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['centre' => 'exact', 'nom' => 'partial'])]
#[ApiFilter(OrderFilter::class,  properties: ['ordre', 'nom'])]
class MissionCategorie
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['mission_categorie:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['mission_categorie:read', 'mission_categorie:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    #[Groups(['mission_categorie:read', 'mission_categorie:write'])]
    private ?string $nom = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Groups(['mission_categorie:read', 'mission_categorie:write'])]
    private ?string $couleur = null;

    /**
     * Icône optionnelle — emoji texte court (ex : "📋", "🔓", "🧽").
     * Pas de validation stricte sur le format pour rester ouvert (futur : custom icons).
     */
    #[ORM\Column(length: 32, nullable: true)]
    #[Assert\Length(max: 32)]
    #[Groups(['mission_categorie:read', 'mission_categorie:write'])]
    private ?string $icone = null;

    #[ORM\Column]
    #[Groups(['mission_categorie:read', 'mission_categorie:write'])]
    private int $ordre = 0;

    public function getId(): ?int { return $this->id; }

    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(?string $nom): static { $this->nom = $nom; return $this; }

    public function getCouleur(): ?string { return $this->couleur; }
    public function setCouleur(?string $couleur): static { $this->couleur = $couleur; return $this; }

    public function getIcone(): ?string { return $this->icone; }
    public function setIcone(?string $icone): static { $this->icone = $icone; return $this; }

    public function getOrdre(): int { return $this->ordre; }
    public function setOrdre(int $ordre): static { $this->ordre = $ordre; return $this; }
}

<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\PrestationRepository;
use App\State\PrestationCreateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Prestation — offre commerciale publique d'un centre (ex. « Partie de bowling »).
 * Ce qu'un visiteur voit sur le site public du client, rattaché par domaine au tenant.
 *
 * **Lecture PUBLIQUE** : via le contrôleur {@see \App\Controller\Web\PublicSiteController}
 * (host → centre). **Écriture/CRUD GÉRANT** : via API Platform (ROLE_MANAGER), isolée
 * par CentreQueryExtension + {@see \App\Security\Voter\PrestationVoter}. À la création,
 * le centre est imposé côté serveur ({@see PrestationCreateProcessor}).
 */
#[ORM\Entity(repositoryClass: PrestationRepository::class)]
#[ORM\Table(name: 'prestation')]
#[ORM\Index(name: 'idx_prestation_centre', columns: ['centre_id'])]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    normalizationContext: ['groups' => ['prestation:read']],
    denormalizationContext: ['groups' => ['prestation:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        new Post(security: "is_granted('ROLE_MANAGER')", processor: PrestationCreateProcessor::class),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
        new Delete(security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"),
    ],
)]
#[ApiFilter(OrderFilter::class, properties: ['ordre', 'nom'])]
class Prestation
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['prestation:read'])]
    private ?int $id = null;

    /** Tenant propriétaire : toute prestation appartient à un centre (isolation). */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    #[Groups(['prestation:read', 'prestation:write'])]
    private ?string $nom = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\Length(max: 2000)]
    #[Groups(['prestation:read', 'prestation:write'])]
    private ?string $description = null;

    /**
     * Prix unitaire public en **centimes** (entier, jamais de flottant pour de la
     * monnaie). Base de calcul du montant d'une réservation (prix × personnes).
     * 0 = gratuit / non tarifé.
     */
    #[ORM\Column(options: ['default' => 0])]
    #[Assert\PositiveOrZero(message: 'Le prix ne peut pas être négatif.')]
    #[Groups(['prestation:read', 'prestation:write'])]
    private int $prixCents = 0;

    /** Ordre d'affichage sur le site public (croissant). */
    #[ORM\Column(options: ['default' => 0])]
    #[Groups(['prestation:read', 'prestation:write'])]
    private int $ordre = 0;

    /** Masquage public sans suppression (une prestation inactive n'est jamais servie). */
    #[ORM\Column(options: ['default' => true])]
    #[Groups(['prestation:read', 'prestation:write'])]
    private bool $actif = true;

    #[ORM\Column]
    #[Groups(['prestation:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
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

    public function setCentre(?Centre $centre): static
    {
        $this->centre = $centre;

        return $this;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getPrixCents(): int
    {
        return $this->prixCents;
    }

    public function setPrixCents(int $prixCents): static
    {
        $this->prixCents = $prixCents;

        return $this;
    }

    public function getOrdre(): int
    {
        return $this->ordre;
    }

    public function setOrdre(int $ordre): static
    {
        $this->ordre = $ordre;

        return $this;
    }

    public function isActif(): bool
    {
        return $this->actif;
    }

    public function setActif(bool $actif): static
    {
        $this->actif = $actif;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

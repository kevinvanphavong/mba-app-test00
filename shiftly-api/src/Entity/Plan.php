<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\PlanRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Plan — pack commercial du catalogue AGENCE (Pack Web, Pack Complet…). Catalogue
 * GLOBAL : pas de `centre_id`, non filtré par tenant. Un centre en référence un via
 * {@see Centre::$plan} ; son `abonnementMensuelCents` en est dérivé (base de P2b Stripe).
 *
 * Exposé UNIQUEMENT au super-admin, sous `/api/superadmin/plans` (firewall superadmin)
 * + `security: ROLE_SUPERADMIN` sur chaque opération (défense en profondeur). Montants
 * en CENTIMES, entiers, jamais négatifs.
 */
#[ORM\Entity(repositoryClass: PlanRepository::class)]
#[ORM\Table(name: 'plan')]
#[UniqueEntity(fields: ['cle'], message: 'Cette clé de plan est déjà utilisée.')]
#[ApiResource(
    routePrefix: '/superadmin',
    normalizationContext: ['groups' => ['plan:read']],
    denormalizationContext: ['groups' => ['plan:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_SUPERADMIN')"),
        new Get(security: "is_granted('ROLE_SUPERADMIN')"),
        new Post(security: "is_granted('ROLE_SUPERADMIN')"),
        new Patch(security: "is_granted('ROLE_SUPERADMIN')"),
        new Delete(security: "is_granted('ROLE_SUPERADMIN')"),
    ],
    order: ['prixMensuelCents' => 'ASC'],
)]
class Plan
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['plan:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom du plan est requis.')]
    #[Assert\Length(max: 100)]
    #[Groups(['plan:read', 'plan:write'])]
    private ?string $nom = null;

    /** Clé technique stable et unique (ex. `pack_web`). */
    #[ORM\Column(length: 60, unique: true)]
    #[Assert\NotBlank(message: 'La clé est requise.')]
    #[Assert\Length(max: 60)]
    #[Assert\Regex(pattern: '/^[a-z0-9_]+$/', message: 'Clé en minuscules, chiffres et underscores uniquement.')]
    #[Groups(['plan:read', 'plan:write'])]
    private ?string $cle = null;

    /** Prix mensuel en CENTIMES (entier ≥ 0 ; borné dans le setter). */
    #[ORM\Column(options: ['default' => 0])]
    #[Assert\PositiveOrZero(message: 'Le prix ne peut pas être négatif.')]
    #[Groups(['plan:read', 'plan:write'])]
    private int $prixMensuelCents = 0;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['plan:read', 'plan:write'])]
    private bool $actif = true;

    #[ORM\Column]
    #[Groups(['plan:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getCle(): ?string
    {
        return $this->cle;
    }

    public function setCle(string $cle): static
    {
        $this->cle = $cle;

        return $this;
    }

    public function getPrixMensuelCents(): int
    {
        return $this->prixMensuelCents;
    }

    public function setPrixMensuelCents(int $prixMensuelCents): static
    {
        // Jamais de prix négatif, même si la validation était contournée.
        $this->prixMensuelCents = max(0, $prixMensuelCents);

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

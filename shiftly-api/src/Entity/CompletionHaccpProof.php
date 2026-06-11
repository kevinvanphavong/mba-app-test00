<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\CompletionHaccpProofRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Preuve HACCP attachée à une Completion (T° relevée, DLC, photo).
 *
 * Relation 1-1 avec Completion (ON DELETE CASCADE).
 * `estConforme` est calculé à l'insert via HaccpProofConformityChecker.
 * Création : cascade depuis POST /api/completions/haccp ou /api/completions
 * (sous-objet haccpProof). Lecture : VIEW manager + employé du centre.
 * Edition/Delete : MANAGER only (correction a posteriori).
 */
#[ORM\Entity(repositoryClass: CompletionHaccpProofRepository::class)]
#[ORM\Table(name: 'completion_haccp_proof')]
#[ORM\UniqueConstraint(name: 'uniq_haccp_proof_completion', columns: ['completion_id'])]
#[ORM\Index(columns: ['centre_id', 'created_at'], name: 'idx_haccp_proof_centre_date')]
#[ORM\Index(columns: ['releve_par_id'], name: 'idx_haccp_proof_releveur')]
#[ApiResource(
    shortName: 'CompletionHaccpProof',
    normalizationContext: ['groups' => ['haccp_proof:read']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_USER') and is_granted('VIEW', object)"),
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
        new Delete(security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'centre' => 'exact',
    'estConforme' => 'exact',
    'relevePar' => 'exact',
])]
#[ApiFilter(DateFilter::class, properties: ['createdAt'])]
class CompletionHaccpProof
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'haccpProof', targetEntity: Completion::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['haccp_proof:read'])]
    private ?Completion $completion = null;

    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['haccp_proof:read'])]
    private ?Centre $centre = null;

    // Décimal sérialisé/dénormalisé comme string (xsd:decimal, cf. note HaccpEquipement::$seuilMin).
    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?string $valeurNumerique = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?\DateTimeImmutable $dateReleve = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['haccp_proof:read', 'completion:read'])]
    private ?string $photoPath = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['haccp_proof:read'])]
    private ?string $photoMimeType = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?string $note = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?bool $estConforme = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['haccp_proof:read', 'haccp_registre:read'])]
    private ?User $relevePar = null;

    #[ORM\Column]
    #[Groups(['haccp_proof:read', 'completion:read', 'haccp_registre:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCompletion(): ?Completion
    {
        return $this->completion;
    }

    public function setCompletion(?Completion $c): static
    {
        $this->completion = $c;

        return $this;
    }

    public function getCentre(): ?Centre
    {
        return $this->centre;
    }

    public function setCentre(?Centre $c): static
    {
        $this->centre = $c;

        return $this;
    }

    public function getValeurNumerique(): ?float
    {
        return null === $this->valeurNumerique ? null : (float) $this->valeurNumerique;
    }

    public function setValeurNumerique(?float $v): static
    {
        $this->valeurNumerique = null === $v ? null : number_format($v, 2, '.', '');

        return $this;
    }

    public function getDateReleve(): ?\DateTimeImmutable
    {
        return $this->dateReleve;
    }

    public function setDateReleve(?\DateTimeImmutable $d): static
    {
        $this->dateReleve = $d;

        return $this;
    }

    public function getPhotoPath(): ?string
    {
        return $this->photoPath;
    }

    public function setPhotoPath(?string $p): static
    {
        $this->photoPath = $p;

        return $this;
    }

    public function getPhotoMimeType(): ?string
    {
        return $this->photoMimeType;
    }

    public function setPhotoMimeType(?string $m): static
    {
        $this->photoMimeType = $m;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $n): static
    {
        $this->note = $n;

        return $this;
    }

    public function getEstConforme(): ?bool
    {
        return $this->estConforme;
    }

    public function setEstConforme(?bool $c): static
    {
        $this->estConforme = $c;

        return $this;
    }

    public function getRelevePar(): ?User
    {
        return $this->relevePar;
    }

    public function setRelevePar(?User $u): static
    {
        $this->relevePar = $u;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\StaffCompetenceRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Compétence acquise par un membre du staff.
 * L'acquisition incrémente les points de l'User via lifecycle callback.
 *
 * POST /api/staff_competences  → MANAGER attribue une compétence
 * DELETE /api/staff_competences/{id} → MANAGER révoque
 */
#[ORM\Entity(repositoryClass: StaffCompetenceRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_staff_comp', columns: ['user_id', 'competence_id'])]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    normalizationContext:   ['groups' => ['staffcompetence:read']],
    denormalizationContext: ['groups' => ['staffcompetence:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security:           "is_granted('ROLE_USER') and is_granted('VIEW', object)"),
        new Post(
            description:             'Attribuer une compétence (MANAGER)',
            security:                "is_granted('ROLE_MANAGER')",
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Delete(
            description: 'Révoquer une compétence (MANAGER)',
            security:    "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'user'       => 'exact',    // ?user=/api/users/3
    'competence' => 'exact',    // ?competence=/api/competences/2
])]
#[ApiFilter(DateFilter::class, properties: ['acquiredAt'])]
class StaffCompetence
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['staffcompetence:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'staffCompetences')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['staffcompetence:read', 'staffcompetence:write'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Competence::class, inversedBy: 'staffCompetences')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['staffcompetence:read', 'staffcompetence:write'])]
    private ?Competence $competence = null;

    #[ORM\Column]
    #[Groups(['staffcompetence:read'])]
    private ?\DateTimeImmutable $acquiredAt = null;

    public function __construct()
    {
        $this->acquiredAt = new \DateTimeImmutable();
    }

    #[ORM\PostPersist]
    public function onAcquire(): void
    {
        if ($this->user && $this->competence) {
            $this->user->addPoints($this->competence->getPoints());
        }
    }

    #[ORM\PostRemove]
    public function onRevoke(): void
    {
        if ($this->user && $this->competence) {
            $this->user->setPoints(max(0, $this->user->getPoints() - $this->competence->getPoints()));
        }
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getCompetence(): ?Competence { return $this->competence; }
    public function setCompetence(?Competence $competence): static { $this->competence = $competence; return $this; }
    public function getAcquiredAt(): ?\DateTimeImmutable { return $this->acquiredAt; }
    public function setAcquiredAt(\DateTimeImmutable $dt): static { $this->acquiredAt = $dt; return $this; }
}

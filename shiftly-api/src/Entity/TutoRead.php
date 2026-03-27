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
use App\Repository\TutoReadRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Marquer un tutoriel comme lu.
 * POST /api/tuto_reads { "tutoriel": "/api/tutoriels/1" }
 * DELETE → démarquer (auteur ou MANAGER)
 * GET collection → employé voit ses propres lectures, MANAGER voit tout le centre
 */
#[ORM\Entity(repositoryClass: TutoReadRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_tutoread', columns: ['user_id', 'tutoriel_id'])]
#[ApiResource(
    normalizationContext:   ['groups' => ['tutoread:read']],
    denormalizationContext: ['groups' => ['tutoread:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(
            security: "is_granted('ROLE_USER') and is_granted('VIEW', object)"
        ),
        new Post(
            description:             'Marquer un tutoriel comme lu',
            securityPostDenormalize: "is_granted('CREATE', object)"
        ),
        new Delete(
            description: 'Démarquer (auteur ou MANAGER)',
            security:    "is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'user'     => 'exact',    // ?user=/api/users/3
    'tutoriel' => 'exact',    // ?tutoriel=/api/tutoriels/1
])]
#[ApiFilter(DateFilter::class, properties: ['readAt'])]
class TutoRead
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['tutoread:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'tutoReads')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tutoread:read', 'tutoread:write'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Tutoriel::class, inversedBy: 'lectures')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tutoread:read', 'tutoread:write'])]
    private ?Tutoriel $tutoriel = null;

    #[ORM\Column]
    #[Groups(['tutoread:read'])]
    private ?\DateTimeImmutable $readAt = null;

    public function __construct()
    {
        $this->readAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getTutoriel(): ?Tutoriel { return $this->tutoriel; }
    public function setTutoriel(?Tutoriel $tutoriel): static { $this->tutoriel = $tutoriel; return $this; }
    public function getReadAt(): ?\DateTimeImmutable { return $this->readAt; }
    public function setReadAt(\DateTimeImmutable $readAt): static { $this->readAt = $readAt; return $this; }
}

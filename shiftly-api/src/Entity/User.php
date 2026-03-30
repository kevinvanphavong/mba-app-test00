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
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[UniqueEntity('email')]
#[ApiResource(
    normalizationContext:   ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: [
        new GetCollection(
            security:    "is_granted('ROLE_USER')",
            description: 'Liste du staff. Filtrer par ?centre=/api/centres/{id}'
        ),
        new Get(
            security: "is_granted('ROLE_USER')"
        ),
        new Post(
            security:                "is_granted('ROLE_MANAGER')",
            description:             'Créer un membre (MANAGER only)',
            validationContext:       ['groups' => ['Default', 'user:create']],
            denormalizationContext:  ['groups' => ['user:write', 'user:create']]
        ),
        new Put(
            security:    "is_granted('ROLE_MANAGER') or object == user",
            description: 'Modifier un membre : MANAGER ou soi-même'
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER')"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'nom'     => 'partial',
    'email'   => 'partial',
    'role'    => 'exact',
    'centre'  => 'exact',           // ?centre=/api/centres/1
])]
#[ApiFilter(OrderFilter::class, properties: ['nom', 'points', 'createdAt'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    const ROLE_MANAGER = 'MANAGER';
    const ROLE_EMPLOYE = 'EMPLOYE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['user:read', 'poste:read', 'completion:read', 'incident:read',
              'staffcompetence:read', 'tutoread:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Centre::class, inversedBy: 'users')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['user:read', 'user:write'])]
    private ?Centre $centre = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['user:read', 'user:write', 'poste:read', 'incident:read',
              'staffcompetence:read', 'tutoread:read'])]
    private ?string $nom = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\Email]
    #[Assert\NotBlank(groups: ['user:create'])]
    #[Groups(['user:read', 'user:write'])]
    private ?string $email = null;

    #[ORM\Column]
    private ?string $password = null;

    #[Groups(['user:write', 'user:create'])]
    #[Assert\NotBlank(groups: ['user:create'])]
    #[Assert\Length(min: 8)]
    private ?string $plainPassword = null;

    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column(length: 20)]
    #[Groups(['user:read', 'user:write', 'poste:read'])]
    private string $role = self::ROLE_EMPLOYE;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['user:read', 'user:write', 'poste:read', 'staffcompetence:read'])]
    private ?string $avatarColor = null;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private int $points = 0;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'poste:read', 'staffcompetence:read'])]
    private ?string $prenom = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $tailleHaut = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $tailleBas = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $pointure = null;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['user:read', 'user:write'])]
    private bool $actif = true;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: StaffCompetence::class, cascade: ['remove'])]
    private Collection $staffCompetences;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: TutoRead::class, cascade: ['remove'])]
    private Collection $tutoReads;

    public function __construct()
    {
        $this->staffCompetences = new ArrayCollection();
        $this->tutoReads        = new ArrayCollection();
        $this->createdAt        = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getCentre(): ?Centre { return $this->centre; }
    public function setCentre(?Centre $centre): static { $this->centre = $centre; return $this; }
    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(?string $prenom): static { $this->prenom = $prenom; return $this; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getRole(): string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }
    public function getAvatarColor(): ?string { return $this->avatarColor; }
    public function setAvatarColor(?string $c): static { $this->avatarColor = $c; return $this; }
    public function getPoints(): int { return $this->points; }
    public function setPoints(int $points): static { $this->points = $points; return $this; }
    public function addPoints(int $pts): static { $this->points += $pts; return $this; }
    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function getTailleHaut(): ?string { return $this->tailleHaut; }
    public function setTailleHaut(?string $t): static { $this->tailleHaut = $t; return $this; }
    public function getTailleBas(): ?string { return $this->tailleBas; }
    public function setTailleBas(?string $t): static { $this->tailleBas = $t; return $this; }
    public function getPointure(): ?string { return $this->pointure; }
    public function setPointure(?string $p): static { $this->pointure = $p; return $this; }
    public function isActif(): bool { return $this->actif; }
    public function setActif(bool $actif): static { $this->actif = $actif; return $this; }
    public function getStaffCompetences(): Collection { return $this->staffCompetences; }
    public function getTutoReads(): Collection { return $this->tutoReads; }

    // UserInterface
    public function getUserIdentifier(): string { return (string) $this->email; }
    public function getRoles(): array
    {
        $roles   = $this->roles;
        $roles[] = 'ROLE_USER';
        if ($this->role === self::ROLE_MANAGER) {
            $roles[] = 'ROLE_MANAGER';
        }
        return array_unique($roles);
    }
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }
    public function getPlainPassword(): ?string { return $this->plainPassword; }
    public function setPlainPassword(?string $p): static { $this->plainPassword = $p; return $this; }
    public function eraseCredentials(): void { $this->plainPassword = null; }
}

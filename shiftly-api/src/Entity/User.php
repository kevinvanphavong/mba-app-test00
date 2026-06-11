<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
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
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: [
        new GetCollection(
            security: "is_granted('ROLE_USER')",
            description: 'Liste du staff. Filtrer par ?centre=/api/centres/{id}'
        ),
        new Get(
            security: "is_granted('ROLE_USER')"
        ),
        new Post(
            security: "is_granted('ROLE_MANAGER')",
            description: 'Créer un membre (MANAGER only)',
            validationContext: ['groups' => ['Default', 'user:create']],
            denormalizationContext: ['groups' => ['user:write', 'user:create']]
        ),
        new Put(
            security: "(is_granted('ROLE_MANAGER') and is_granted('EDIT', object)) or object == user",
            description: 'Modifier un membre : MANAGER du même centre ou soi-même'
        ),
        new Delete(
            security: "is_granted('ROLE_MANAGER') and is_granted('DELETE', object)"
        ),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'nom' => 'partial',
    'email' => 'partial',
    'role' => 'exact',
    'centre' => 'exact',           // ?centre=/api/centres/1
])]
#[ApiFilter(OrderFilter::class, properties: ['nom', 'points', 'createdAt'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const ROLE_MANAGER = 'MANAGER';
    public const ROLE_EMPLOYE = 'EMPLOYE';
    public const ROLE_SUPERADMIN = 'SUPERADMIN';

    /** Motifs de sortie — enum applicative pour le registre du personnel (Art. D1221-23). */
    public const MOTIF_DEMISSION = 'demission';
    public const MOTIF_RUPTURE_CONVENTIONNELLE = 'rupture_conventionnelle';
    public const MOTIF_LICENCIEMENT = 'licenciement';
    public const MOTIF_FIN_CDD = 'fin_cdd';
    public const MOTIF_FIN_PERIODE_ESSAI = 'fin_periode_essai';
    public const MOTIF_RETRAITE = 'retraite';
    public const MOTIF_AUTRE = 'autre';

    public const MOTIFS_SORTIE = [
        self::MOTIF_DEMISSION,
        self::MOTIF_RUPTURE_CONVENTIONNELLE,
        self::MOTIF_LICENCIEMENT,
        self::MOTIF_FIN_CDD,
        self::MOTIF_FIN_PERIODE_ESSAI,
        self::MOTIF_RETRAITE,
        self::MOTIF_AUTRE,
    ];

    public const SEXES = ['M', 'F'];

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

    #[ORM\Column(nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $lastLoginAt = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:write', 'poste:read', 'staffcompetence:read'])]
    private ?string $prenom = null;

    /** Champ texte libre — descriptions d'équipement vestimentaire fourni au salarié. */
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $tailleHaut = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $tailleBas = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $pointure = null;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['user:read', 'user:write'])]
    private bool $actif = true;

    /** Heures contractuelles par semaine */
    #[ORM\Column(nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?int $heuresHebdo = null;

    /** Type de contrat : CDI, CDD, EXTRA, ALTERNANCE, STAGE */
    #[ORM\Column(length: 30, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $typeContrat = null;

    /** Code PIN à 4 chiffres pour le module Pointage — jamais exposé dans les réponses publiques */
    #[ORM\Column(length: 4, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $codePointage = null;

    /** Date d'embauche — sert au calcul d'ancienneté côté front. */
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?\DateTimeImmutable $dateEmbauche = null;

    // ─── Registre du personnel (Art. L1221-13 et D1221-23 du Code du travail) ───
    // Tous nullables — un User existant n'a pas forcément ces infos remplies.
    // Lisibles par MANAGER + soi-même ; écrivables uniquement par MANAGER
    // (contrôle dans UserStateProcessor — l'employé qui PUT sur sa fiche
    // ne peut pas écrire ces champs).

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?\DateTimeImmutable $dateNaissance = null;

    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $lieuNaissanceCommune = null;

    #[ORM\Column(length: 60, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $lieuNaissanceDepartement = null;

    #[ORM\Column(length: 1, nullable: true)]
    #[Assert\Choice(choices: self::SEXES, message: 'Sexe invalide.')]
    #[Groups(['user:read', 'user:write'])]
    private ?string $sexe = null;

    #[ORM\Column(length: 60, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $nationalite = null;

    /** Intitulé contractuel (≠ role applicatif) — ex. "Responsable bar", "Hôte d'accueil". */
    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $emploi = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $adresse = null;

    #[ORM\Column(length: 10, nullable: true)]
    #[Assert\Regex(pattern: '/^[0-9A-Z\- ]{2,10}$/', message: 'Code postal invalide.')]
    #[Groups(['user:read', 'user:write'])]
    private ?string $codePostal = null;

    #[ORM\Column(length: 120, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $ville = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $telephone = null;

    /** Date de sortie — écriture réservée MANAGER (groupe user:rh-write). */
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    #[Groups(['user:read', 'user:rh-write'])]
    private ?\DateTimeImmutable $dateSortie = null;

    /** Motif de sortie — un de self::MOTIFS_SORTIE. Écriture MANAGER uniquement. */
    #[ORM\Column(length: 40, nullable: true)]
    #[Assert\Choice(choices: self::MOTIFS_SORTIE, message: 'Motif de sortie invalide.')]
    #[Groups(['user:read', 'user:rh-write'])]
    private ?string $motifSortie = null;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: StaffCompetence::class, cascade: ['remove'])]
    private Collection $staffCompetences;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: TutoRead::class, cascade: ['remove'])]
    private Collection $tutoReads;

    public function __construct()
    {
        $this->staffCompetences = new ArrayCollection();
        $this->tutoReads = new ArrayCollection();
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

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(?string $prenom): static
    {
        $this->prenom = $prenom;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getAvatarColor(): ?string
    {
        return $this->avatarColor;
    }

    public function setAvatarColor(?string $c): static
    {
        $this->avatarColor = $c;

        return $this;
    }

    public function getPoints(): int
    {
        return $this->points;
    }

    public function setPoints(int $points): static
    {
        $this->points = $points;

        return $this;
    }

    public function addPoints(int $pts): static
    {
        $this->points += $pts;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getLastLoginAt(): ?\DateTimeImmutable
    {
        return $this->lastLoginAt;
    }

    public function setLastLoginAt(?\DateTimeImmutable $lastLoginAt): static
    {
        $this->lastLoginAt = $lastLoginAt;

        return $this;
    }

    public function getTailleHaut(): ?string
    {
        return $this->tailleHaut;
    }

    public function setTailleHaut(?string $t): static
    {
        $this->tailleHaut = $t;

        return $this;
    }

    public function getTailleBas(): ?string
    {
        return $this->tailleBas;
    }

    public function setTailleBas(?string $t): static
    {
        $this->tailleBas = $t;

        return $this;
    }

    public function getPointure(): ?string
    {
        return $this->pointure;
    }

    public function setPointure(?string $p): static
    {
        $this->pointure = $p;

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

    public function getHeuresHebdo(): ?int
    {
        return $this->heuresHebdo;
    }

    public function setHeuresHebdo(?int $h): static
    {
        $this->heuresHebdo = $h;

        return $this;
    }

    public function getTypeContrat(): ?string
    {
        return $this->typeContrat;
    }

    public function setTypeContrat(?string $t): static
    {
        $this->typeContrat = $t;

        return $this;
    }

    public function getCodePointage(): ?string
    {
        return $this->codePointage;
    }

    public function setCodePointage(?string $code): static
    {
        $this->codePointage = $code;

        return $this;
    }

    public function getDateEmbauche(): ?\DateTimeImmutable
    {
        return $this->dateEmbauche;
    }

    public function setDateEmbauche(?\DateTimeImmutable $d): static
    {
        $this->dateEmbauche = $d;

        return $this;
    }

    // ─── Registre du personnel ───
    public function getDateNaissance(): ?\DateTimeImmutable
    {
        return $this->dateNaissance;
    }

    public function setDateNaissance(?\DateTimeImmutable $d): static
    {
        $this->dateNaissance = $d;

        return $this;
    }

    public function getLieuNaissanceCommune(): ?string
    {
        return $this->lieuNaissanceCommune;
    }

    public function setLieuNaissanceCommune(?string $v): static
    {
        $this->lieuNaissanceCommune = $v;

        return $this;
    }

    public function getLieuNaissanceDepartement(): ?string
    {
        return $this->lieuNaissanceDepartement;
    }

    public function setLieuNaissanceDepartement(?string $v): static
    {
        $this->lieuNaissanceDepartement = $v;

        return $this;
    }

    public function getSexe(): ?string
    {
        return $this->sexe;
    }

    public function setSexe(?string $v): static
    {
        $this->sexe = $v;

        return $this;
    }

    public function getNationalite(): ?string
    {
        return $this->nationalite;
    }

    public function setNationalite(?string $v): static
    {
        $this->nationalite = $v;

        return $this;
    }

    public function getEmploi(): ?string
    {
        return $this->emploi;
    }

    public function setEmploi(?string $v): static
    {
        $this->emploi = $v;

        return $this;
    }

    public function getAdresse(): ?string
    {
        return $this->adresse;
    }

    public function setAdresse(?string $v): static
    {
        $this->adresse = $v;

        return $this;
    }

    public function getCodePostal(): ?string
    {
        return $this->codePostal;
    }

    public function setCodePostal(?string $v): static
    {
        $this->codePostal = $v;

        return $this;
    }

    public function getVille(): ?string
    {
        return $this->ville;
    }

    public function setVille(?string $v): static
    {
        $this->ville = $v;

        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(?string $v): static
    {
        $this->telephone = $v;

        return $this;
    }

    public function getDateSortie(): ?\DateTimeImmutable
    {
        return $this->dateSortie;
    }

    public function setDateSortie(?\DateTimeImmutable $d): static
    {
        $this->dateSortie = $d;

        return $this;
    }

    public function getMotifSortie(): ?string
    {
        return $this->motifSortie;
    }

    public function setMotifSortie(?string $v): static
    {
        $this->motifSortie = $v;

        return $this;
    }

    public function getStaffCompetences(): Collection
    {
        return $this->staffCompetences;
    }

    public function getTutoReads(): Collection
    {
        return $this->tutoReads;
    }

    // UserInterface
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        if (self::ROLE_MANAGER === $this->role) {
            $roles[] = 'ROLE_MANAGER';
        }
        if (self::ROLE_SUPERADMIN === $this->role) {
            $roles[] = 'ROLE_SUPERADMIN';
        }

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getPlainPassword(): ?string
    {
        return $this->plainPassword;
    }

    public function setPlainPassword(?string $p): static
    {
        $this->plainPassword = $p;

        return $this;
    }

    public function eraseCredentials(): void
    {
        $this->plainPassword = null;
    }
}

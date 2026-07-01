<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\DemandeB2BRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

/**
 * Demande B2B déposée par un prospect sur le site public d'un centre (devis, privatisation,
 * séminaire…). Isolée par `centre` (FK). Écrite par le controller public (résolu par host) ;
 * lue/traitée par le gérant du centre via API Platform (filtrée par CentreQueryExtension).
 *
 * Distincte de {@see Lead} (prospect Shiftly SaaS, global, sans centre) : ici c'est une
 * demande adressée AU client, rattachée à SON centre — modèle d'isolation différent.
 */
#[ORM\Entity(repositoryClass: DemandeB2BRepository::class)]
#[ORM\Table(name: 'demande_b2b')]
#[ORM\Index(name: 'idx_demande_b2b_centre', columns: ['centre_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['demande_b2b:read']],
    denormalizationContext: ['groups' => ['demande_b2b:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_MANAGER')"),
        new Get(security: "is_granted('ROLE_MANAGER') and is_granted('VIEW', object)"),
        // Le gérant fait avancer le statut (le contenu de la demande reste immuable).
        new Patch(security: "is_granted('ROLE_MANAGER') and is_granted('EDIT', object)"),
    ],
)]
class DemandeB2B
{
    public const STATUT_NOUVELLE = 'NOUVELLE';
    public const STATUT_EN_COURS = 'EN_COURS';
    public const STATUT_DEVIS_ENVOYE = 'DEVIS_ENVOYE';
    public const STATUT_CLOTUREE = 'CLOTUREE';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['demande_b2b:read'])]
    private ?int $id = null;

    /** Tenant propriétaire : isolation par centre. */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\Column(length: 120)]
    #[Groups(['demande_b2b:read'])]
    private ?string $nomContact = null;

    #[ORM\Column(length: 180)]
    #[Groups(['demande_b2b:read'])]
    private ?string $email = null;

    #[ORM\Column(length: 30)]
    #[Groups(['demande_b2b:read'])]
    private ?string $telephone = null;

    #[ORM\Column(length: 180, nullable: true)]
    #[Groups(['demande_b2b:read'])]
    private ?string $societe = null;

    #[ORM\Column(length: 120)]
    #[Groups(['demande_b2b:read'])]
    private ?string $typeEvenement = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['demande_b2b:read'])]
    private ?int $nbPersonnes = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['demande_b2b:read'])]
    private ?\DateTimeImmutable $dateSouhaitee = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['demande_b2b:read'])]
    private ?string $message = null;

    #[ORM\Column(length: 30)]
    #[Groups(['demande_b2b:read', 'demande_b2b:write'])]
    private string $statut = self::STATUT_NOUVELLE;

    #[ORM\Column]
    #[Groups(['demande_b2b:read'])]
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

    public function getNomContact(): ?string
    {
        return $this->nomContact;
    }

    public function setNomContact(string $nomContact): static
    {
        $this->nomContact = $nomContact;

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

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(string $telephone): static
    {
        $this->telephone = $telephone;

        return $this;
    }

    public function getSociete(): ?string
    {
        return $this->societe;
    }

    public function setSociete(?string $societe): static
    {
        $this->societe = $societe;

        return $this;
    }

    public function getTypeEvenement(): ?string
    {
        return $this->typeEvenement;
    }

    public function setTypeEvenement(string $typeEvenement): static
    {
        $this->typeEvenement = $typeEvenement;

        return $this;
    }

    public function getNbPersonnes(): ?int
    {
        return $this->nbPersonnes;
    }

    public function setNbPersonnes(?int $nbPersonnes): static
    {
        $this->nbPersonnes = $nbPersonnes;

        return $this;
    }

    public function getDateSouhaitee(): ?\DateTimeImmutable
    {
        return $this->dateSouhaitee;
    }

    public function setDateSouhaitee(?\DateTimeImmutable $dateSouhaitee): static
    {
        $this->dateSouhaitee = $dateSouhaitee;

        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(string $message): static
    {
        $this->message = $message;

        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}

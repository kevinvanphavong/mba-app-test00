<?php

namespace App\Entity;

use App\Repository\PrestationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Prestation — offre commerciale publique d'un centre (ex. « Partie de bowling »,
 * « Session laser game »). Première brique de la Branche 1 (module Web/Site) : ce
 * qu'un visiteur voit sur le site public du client, rattaché par domaine au tenant.
 *
 * Distincte des entités internes (Service = créneau d'exploitation, Mission = tâche
 * staff, Poste = poste de travail) : celles-ci ne sont pas destinées au public.
 *
 * **Pas exposée via API Platform** : la seule lecture publique passe par le
 * contrôleur dédié {@see \App\Controller\Web\PublicSiteController}, qui résout le
 * centre par le host et filtre explicitement par ce centre. Aucune surface
 * authentifiée n'est ouverte ici (édition = chantier ultérieur).
 */
#[ORM\Entity(repositoryClass: PrestationRepository::class)]
#[ORM\Table(name: 'prestation')]
#[ORM\Index(name: 'idx_prestation_centre', columns: ['centre_id'])]
#[ORM\HasLifecycleCallbacks]
class Prestation
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    /** Tenant propriétaire : toute prestation appartient à un centre (isolation). */
    #[ORM\ManyToOne(targetEntity: Centre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Centre $centre = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 120)]
    private ?string $nom = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    /** Ordre d'affichage sur le site public (croissant). */
    #[ORM\Column(options: ['default' => 0])]
    private int $ordre = 0;

    /** Masquage public sans suppression (une prestation inactive n'est jamais servie). */
    #[ORM\Column(options: ['default' => true])]
    private bool $actif = true;

    #[ORM\Column]
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

<?php

namespace App\Service;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\IaGeneratorInterface;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Génère un devis BROUILLON pré-rempli par l'IA à partir d'une demande B2B.
 *
 * Passe TOUJOURS par {@see IaGeneratorInterface} (quota par centre, coupe-circuit) —
 * jamais AiService en direct. Les montants sont figés CÔTÉ SERVEUR : l'IA ne propose
 * que désignation/quantité/prix unitaire, le montant de ligne et le total sont
 * recalculés ici (jamais reçus du client). Le devis n'est jamais envoyé : statut
 * BROUILLON, éditable par le gérant.
 */
final class DevisGenerator
{
    /** Schéma de sortie structurée imposé à l'IA. */
    private const SCHEMA = [
        'type' => 'object',
        'additionalProperties' => false,
        'required' => ['lignes'],
        'properties' => [
            'lignes' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => ['designation', 'quantite', 'prixUnitaireCents'],
                    'properties' => [
                        'designation' => ['type' => 'string'],
                        'quantite' => ['type' => 'integer'],
                        'prixUnitaireCents' => ['type' => 'integer'],
                    ],
                ],
            ],
        ],
    ];

    public function __construct(
        private readonly IaGeneratorInterface $ia,
        private readonly EntityManagerInterface $em,
        private readonly DevisLignesNormalizer $normalizer,
    ) {
    }

    public function genererPour(DemandeB2B $demande): Devis
    {
        $centre = $demande->getCentre();
        if (null === $centre) {
            throw new IaIndisponibleException('Demande sans centre : devis impossible.');
        }

        $systeme = 'Tu es assistant commercial. À partir d\'une demande B2B, propose des lignes '
            .'de devis (désignation, quantité, prix unitaire en CENTIMES d\'euros HT). Sois réaliste et concis.';

        // generate() applique le quota du centre ; propage IaQuota/IaIndisponible.
        $json = $this->ia->generate($this->promptDepuis($demande), [
            'systeme' => $systeme,
            'usage' => 'devis',
            'schema' => self::SCHEMA,
            'maxTokens' => 1500,
        ]);

        $lignes = $this->parseLignes($json);

        $devis = (new Devis())
            ->setCentre($centre)
            ->setDemande($demande)
            ->setLignes($lignes)
            ->setTotalCents($this->normalizer->total($lignes))
            ->setStatut(Devis::STATUT_BROUILLON);

        $this->em->persist($devis);
        $this->em->flush();

        return $devis;
    }

    private function promptDepuis(DemandeB2B $demande): string
    {
        return sprintf(
            "Type d'événement : %s\nNombre de personnes : %s\nDate souhaitée : %s\nSociété : %s\nDemande : %s",
            $demande->getTypeEvenement() ?? '',
            $demande->getNbPersonnes() ?? 'n.c.',
            $demande->getDateSouhaitee()?->format('Y-m-d') ?? 'n.c.',
            $demande->getSociete() ?? 'n.c.',
            $demande->getMessage() ?? '',
        );
    }

    /**
     * Décode et NORMALISE les lignes IA : le montant de chaque ligne est recalculé
     * (quantité × prix unitaire), jamais celui éventuellement fourni par l'IA.
     *
     * @return list<array{designation: string, quantite: int, prixUnitaireCents: int, montantCents: int}>
     */
    private function parseLignes(string $json): array
    {
        $data = json_decode($json, true);
        if (!\is_array($data) || !\is_array($data['lignes'] ?? null) || [] === $data['lignes']) {
            // Sortie IA inexploitable : traité comme « pas de devis » (demande préservée).
            throw new IaIndisponibleException('Réponse IA inexploitable pour le devis.');
        }

        // Montants recalculés côté serveur (même règle que l'édition gérant).
        $out = $this->normalizer->normaliser($data['lignes']);
        if ([] === $out) {
            throw new IaIndisponibleException('Aucune ligne de devis exploitable.');
        }

        return $out;
    }
}

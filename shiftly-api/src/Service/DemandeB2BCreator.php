<?php

namespace App\Service;

use App\Core\Ia\Exception\IaIndisponibleException;
use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Dto\CreateDemandeB2BInput;
use App\Entity\Centre;
use App\Entity\DemandeB2B;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Crée une demande B2B pour un centre puis tente d'y pré-remplir un devis via l'IA.
 *
 * Ordre GARANTI : la demande est persistée D'ABORD. La génération du devis est
 * best-effort — si le quota IA est atteint ou l'IA indisponible, on avale l'exception
 * (log) et la demande reste bien enregistrée ; le gérant relancera la génération
 * plus tard. Une demande n'est JAMAIS perdue à cause de l'IA.
 */
final class DemandeB2BCreator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly DevisGenerator $devisGenerator,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function create(Centre $centre, CreateDemandeB2BInput $input): DemandeB2B
    {
        $demande = (new DemandeB2B())
            ->setCentre($centre)
            ->setNomContact(trim((string) $input->nomContact))
            ->setEmail(strtolower(trim((string) $input->email)))
            ->setTelephone(trim((string) $input->telephone))
            ->setSociete(null !== $input->societe ? trim($input->societe) : null)
            ->setTypeEvenement(trim((string) $input->typeEvenement))
            ->setNbPersonnes($input->nbPersonnes)
            ->setDateSouhaitee($input->dateSouhaitee)
            ->setMessage(trim((string) $input->message))
            ->setStatut(DemandeB2B::STATUT_NOUVELLE);

        // 1) La demande est enregistrée d'abord — elle ne dépend jamais de l'IA.
        $this->em->persist($demande);
        $this->em->flush();

        // 2) Pré-remplissage du devis : best-effort, ne fait jamais échouer la demande.
        try {
            $this->devisGenerator->genererPour($demande);
        } catch (IaQuotaDepasseException|IaIndisponibleException $e) {
            $this->logger->info('Devis IA non généré (demande conservée)', [
                'demande' => $demande->getId(),
                'raison' => $e->getMessage(),
            ]);
        }

        return $demande;
    }
}

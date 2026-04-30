<?php

namespace App\Service;

use App\Entity\Pointage;
use App\Entity\PointagePause;
use App\Entity\Poste;
use App\Entity\Service;
use App\Repository\PointageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class PointageService
{
    public function __construct(
        private readonly PointageRepository    $pointageRepository,
        private readonly EntityManagerInterface $em,
    ) {}

    /**
     * Crée un Pointage PREVU pour chaque poste du service qui n'en a pas encore.
     * Idempotent : appelable à chaque GET pour rattraper les postes ajoutés
     * après le premier chargement de la page de pointage.
     */
    public function genererPointagesDepuisPostes(Service $service): array
    {
        $postes = $this->em->createQueryBuilder()
            ->select('p', 'u', 'z')
            ->from(Poste::class, 'p')
            ->leftJoin('p.user', 'u')
            ->leftJoin('p.zone', 'z')
            ->leftJoin(Pointage::class, 'pt', 'WITH', 'pt.poste = p AND pt.service = :service')
            ->andWhere('p.service = :service')
            ->andWhere('pt.id IS NULL')
            ->setParameter('service', $service)
            ->getQuery()
            ->getResult();

        $pointages = [];
        foreach ($postes as $poste) {
            $pointage = new Pointage();
            $pointage->setCentre($service->getCentre());
            $pointage->setService($service);
            $pointage->setPoste($poste);
            $pointage->setUser($poste->getUser());
            $pointage->setStatut(Pointage::STATUT_PREVU);

            $this->em->persist($pointage);
            $pointages[] = $pointage;
        }

        if (count($pointages) > 0) {
            $this->em->flush();
        }

        return $pointages;
    }

    /** Calcule le total des pauses en minutes (terminées + en cours). */
    public function calculerTotalPauses(Pointage $pointage): int
    {
        $total = 0;
        $now   = new \DateTimeImmutable('now');

        foreach ($pointage->getPauses() as $pause) {
            $debut = $pause->getHeureDebut();
            $fin   = $pause->getHeureFin() ?? $now;
            $total += (int) round(($fin->getTimestamp() - $debut->getTimestamp()) / 60);
        }

        return max(0, $total);
    }

    /**
     * Calcule la durée effective en minutes (temps travaillé - pauses).
     * Retourne 0 si l'employé n'a pas encore pointé son arrivée.
     */
    public function calculerDureeEffective(Pointage $pointage): int
    {
        $arrivee = $pointage->getHeureArrivee();
        if (!$arrivee) {
            return 0;
        }

        $fin = $pointage->getHeureDepart() ?? new \DateTimeImmutable('now');
        $duree = (int) round(($fin->getTimestamp() - $arrivee->getTimestamp()) / 60);

        return max(0, $duree - $this->calculerTotalPauses($pointage));
    }

    /**
     * Combine la date du service et l'heure de début du poste en un instant
     * absolu (timestamp), en interprétant l'heure comme locale Europe/Paris.
     *
     * Pourquoi : `Poste.heureDebut` est saisie en heure locale métier (Paris),
     * mais Doctrine retourne `Pointage.heureArrivee` en UTC. Sans précision de
     * timezone, `createFromFormat` utilise la TZ serveur (UTC en prod) et la
     * comparaison sous-estime le retard de l'offset Paris (1h ou 2h).
     */
    private function heureDebutPrevueAbs(Pointage $pointage): ?\DateTimeImmutable
    {
        $poste = $pointage->getPoste();
        if (!$poste || !$poste->getHeureDebut()) {
            return null;
        }

        return \DateTimeImmutable::createFromFormat(
            'Y-m-d H:i',
            $pointage->getService()->getDate()->format('Y-m-d') . ' ' . $poste->getHeureDebut()->format('H:i'),
            new \DateTimeZone('Europe/Paris')
        ) ?: null;
    }

    /** Retourne vrai si l'employé est arrivé après l'heure prévue sur le poste. */
    public function estEnRetard(Pointage $pointage): bool
    {
        $arrivee = $pointage->getHeureArrivee();
        if (!$arrivee) {
            return false;
        }

        $heureDebutPrevue = $this->heureDebutPrevueAbs($pointage);
        return $heureDebutPrevue && $arrivee > $heureDebutPrevue;
    }

    /** Retourne le retard en minutes (0 si à l'heure). */
    public function minutesRetard(Pointage $pointage): int
    {
        if (!$this->estEnRetard($pointage)) {
            return 0;
        }

        $heureDebutPrevue = $this->heureDebutPrevueAbs($pointage);
        if (!$heureDebutPrevue) {
            return 0;
        }

        return (int) round(
            ($pointage->getHeureArrivee()->getTimestamp() - $heureDebutPrevue->getTimestamp()) / 60
        );
    }

    /** Calcule les stats agrégées pour un tableau de pointages. */
    public function calculerStats(array $pointages): array
    {
        $stats = [
            'total'         => count($pointages),
            'presents'      => 0,
            'enPause'       => 0,
            'absents'       => 0,
            'termines'      => 0,
            'prevus'        => 0,
            'retards'       => 0,
            'heuresCumulees' => 0.0,
        ];

        foreach ($pointages as $p) {
            match ($p->getStatut()) {
                Pointage::STATUT_EN_COURS => $stats['presents']++,
                Pointage::STATUT_EN_PAUSE => $stats['enPause']++,
                Pointage::STATUT_ABSENT   => $stats['absents']++,
                Pointage::STATUT_TERMINE  => $stats['termines']++,
                Pointage::STATUT_PREVU    => $stats['prevus']++,
                default => null,
            };

            if ($this->estEnRetard($p)) {
                $stats['retards']++;
            }

            $stats['heuresCumulees'] += $this->calculerDureeEffective($p) / 60;
        }

        $stats['heuresCumulees'] = round($stats['heuresCumulees'], 2);

        return $stats;
    }

    /**
     * Clôture tous les pointages ouverts d'un service :
     * EN_COURS/EN_PAUSE → TERMINE, PREVU → ABSENT.
     * Retourne le nombre de clôturés et d'absents.
     */
    public function cloturerService(Service $service): array
    {
        $pointages = $this->pointageRepository->findByService($service->getId());
        $now       = new \DateTimeImmutable('now');
        $clotures  = 0;
        $absents   = 0;

        foreach ($pointages as $p) {
            if (in_array($p->getStatut(), [Pointage::STATUT_EN_COURS, Pointage::STATUT_EN_PAUSE], true)) {
                // Clôture la pause en cours si nécessaire
                foreach ($p->getPauses() as $pause) {
                    if ($pause->getHeureFin() === null) {
                        $pause->setHeureFin($now);
                    }
                }
                $p->setHeureDepart($now);
                $p->setStatut(Pointage::STATUT_TERMINE);
                $p->setUpdatedAt($now);
                $clotures++;
            } elseif ($p->getStatut() === Pointage::STATUT_PREVU) {
                $p->setStatut(Pointage::STATUT_ABSENT);
                $p->setUpdatedAt($now);
                $absents++;
            }
        }

        $service->setStatut('TERMINE');
        $this->em->flush();

        return ['clotures' => $clotures, 'absents' => $absents];
    }

    /**
     * Vérifie le code PIN d'un pointage.
     * Lance une exception si incorrect ou manquant (sauf bypass manager).
     */
    public function verifierCodePin(Pointage $pointage, ?string $codePin, bool $managerBypass): bool
    {
        if ($managerBypass) {
            return true;
        }

        $codeDefini = $pointage->getUser()->getCodePointage();

        if ($codeDefini === null) {
            throw new BadRequestHttpException(
                'Aucun code PIN défini pour cet employé. Le manager doit en définir un dans Réglages.'
            );
        }

        if ($codePin !== $codeDefini) {
            throw new AccessDeniedHttpException('Code PIN incorrect.');
        }

        return true;
    }
}

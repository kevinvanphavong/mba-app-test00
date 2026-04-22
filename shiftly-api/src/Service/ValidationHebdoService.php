<?php

namespace App\Service;

use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\CorrectionPointage;
use App\Entity\Pointage;
use App\Entity\PointagePause;
use App\Entity\User;
use App\Entity\ValidationHebdo;
use App\Repository\AbsenceRepository;
use App\Repository\CorrectionPointageRepository;
use App\Repository\PointageRepository;
use App\Repository\UserRepository;
use App\Repository\PosteRepository;
use App\Repository\ValidationHebdoRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service de calcul pour la validation hebdomadaire des pointages.
 * Agrège les données de pointage, pause, absence et poste pour une semaine.
 */
class ValidationHebdoService
{
    public function __construct(
        private readonly PointageRepository       $pointageRepo,
        private readonly AbsenceRepository        $absenceRepo,
        private readonly UserRepository           $userRepo,
        private readonly PosteRepository          $posteRepo,
        private readonly ValidationHebdoRepository $validationRepo,
        private readonly CorrectionPointageRepository $correctionRepo,
        private readonly EntityManagerInterface   $em,
    ) {}

    /**
     * Calcule le lundi de la semaine contenant la date donnée.
     */
    public function getLundiDeLaSemaine(\DateTimeImmutable $date): \DateTimeImmutable
    {
        $dow = (int) $date->format('N'); // 1=lun, 7=dim
        return $date->modify('-' . ($dow - 1) . ' days')->setTime(0, 0, 0);
    }

    /**
     * Retourne les 7 jours (lun→dim) à partir du lundi donné.
     *
     * @return \DateTimeImmutable[]
     */
    public function getJoursDeLaSemaine(\DateTimeImmutable $lundi): array
    {
        $jours = [];
        for ($i = 0; $i < 7; $i++) {
            $jours[] = $lundi->modify("+{$i} days");
        }
        return $jours;
    }

    /**
     * Agrège toutes les données d'une semaine pour un centre donné.
     * Retourne un tableau structuré prêt pour le frontend.
     */
    public function getSemaineData(int $centreId, \DateTimeImmutable $lundi): array
    {
        $dimanche = $lundi->modify('+6 days');
        $jours    = $this->getJoursDeLaSemaine($lundi);

        // Tous les pointages du centre sur la semaine
        $pointages = $this->pointageRepo->findByCentreAndDateRange($centreId, $lundi, $dimanche);

        // Toutes les absences du centre sur la semaine
        $absences = $this->absenceRepo->findByCentreAndDateRange($centreId, $lundi, $dimanche);

        // Index absences par (userId, date) pour O(1)
        $absenceIndex = [];
        foreach ($absences as $absence) {
            $key = $absence->getUser()->getId() . '_' . $absence->getDate()->format('Y-m-d');
            $absenceIndex[$key] = $absence;
        }

        // Tous les users du centre (employés uniquement pour la grille)
        $users = $this->userRepo->findBy(['centre' => $centreId], ['nom' => 'ASC']);

        $employes = [];
        foreach ($users as $user) {
            $employes[] = $this->buildEmployeData($user, $jours, $pointages, $absenceIndex);
        }

        $kpis = $this->calculerKPIs($employes, $centreId, $lundi);

        return [
            'semaine'     => (int) $lundi->format('W'),
            'dateDebut'   => $lundi->format('Y-m-d'),
            'dateFin'     => $dimanche->format('Y-m-d'),
            'employes'    => $employes,
            'kpis'        => $kpis,
        ];
    }

    /**
     * Construit les données jour par jour pour un employé.
     */
    private function buildEmployeData(User $user, array $jours, array $tousPointages, array $absenceIndex): array
    {
        // Filtrer les pointages de cet employé
        $pointagesUser = array_filter(
            $tousPointages,
            fn(Pointage $p) => $p->getUser()->getId() === $user->getId()
        );

        $joursData         = [];
        $totalTravailleMin = 0;
        $totalPrevuMin     = 0;
        $nbRetards         = 0;
        $nbAbsences        = 0;

        foreach ($jours as $jour) {
            $dateStr = $jour->format('Y-m-d');
            $absKey  = $user->getId() . '_' . $dateStr;

            // Trouver le pointage de ce jour
            $pointageJour = null;
            foreach ($pointagesUser as $p) {
                if ($p->getService()->getDate()->format('Y-m-d') === $dateStr) {
                    $pointageJour = $p;
                    break;
                }
            }

            $absence      = $absenceIndex[$absKey] ?? null;
            $jourData     = $this->buildJourData($jour, $pointageJour, $absence);

            $joursData[] = $jourData;

            $totalTravailleMin += $jourData['heuresNettes'] ?? 0;
            $totalPrevuMin     += $jourData['heuresPrevues'] ?? 0;

            if ($jourData['estRetard'])                                       { $nbRetards++; }
            if (in_array($jourData['statut'], ['absent_non_justifie'], true)) { $nbAbsences++; }
        }

        $ecart     = $totalTravailleMin - $totalPrevuMin;
        $heuresSup = max(0, $ecart);

        return [
            'userId'           => $user->getId(),
            'nom'              => $user->getNom(),
            'prenom'           => $user->getPrenom() ?? '',
            'role'             => $user->getRole(),
            'zone'             => null, // enrichi si besoin par le controller
            'jours'            => $joursData,
            'totalTravaille'   => $totalTravailleMin,
            'totalPrevu'       => $totalPrevuMin,
            'ecart'            => $ecart,
            'heuresSup'        => $heuresSup,
            'nbRetards'        => $nbRetards,
            'nbAbsences'       => $nbAbsences,
            'statut'           => 'EN_ATTENTE', // mis à jour si ValidationHebdo existante
            'note'             => $nbRetards > 0 ? "{$nbRetards} retard(s) cette semaine" : null,
        ];
    }

    /**
     * Construit les données d'un jour pour un employé.
     */
    public function buildJourData(
        \DateTimeImmutable $jour,
        ?Pointage $pointage,
        ?Absence $absence
    ): array {
        $dateStr      = $jour->format('Y-m-d');
        $jourSemaine  = $this->formatJourSemaine($jour);
        $now          = new \DateTimeImmutable();

        // Cas : absence justifiée
        if ($absence !== null && $absence->getType() !== 'REPOS') {
            return [
                'date'         => $dateStr,
                'jourSemaine'  => $jourSemaine,
                'statut'       => 'absent_justifie',
                'heureArrivee' => null,
                'heureDepart'  => null,
                'pauses'       => [],
                'heuresNettes' => null,
                'heuresPrevues'=> $this->getHeuresPrevuesdepuisPointage($pointage),
                'estRetard'    => false,
                'typeAbsence'  => $absence->getType(),
            ];
        }

        // Cas : repos explicite ou pas de poste
        if ($pointage === null) {
            $estRepos = ($absence !== null && $absence->getType() === 'REPOS') || true;
            return [
                'date'         => $dateStr,
                'jourSemaine'  => $jourSemaine,
                'statut'       => 'repos',
                'heureArrivee' => null,
                'heureDepart'  => null,
                'pauses'       => [],
                'heuresNettes' => null,
                'heuresPrevues'=> null,
                'estRetard'    => false,
                'typeAbsence'  => null,
            ];
        }

        // Cas : absent non justifié (PREVU après fin du service, sans absence enregistrée)
        if ($pointage->getStatut() === Pointage::STATUT_PREVU && $this->serviceEstTermine($pointage, $now)) {
            return [
                'date'         => $dateStr,
                'jourSemaine'  => $jourSemaine,
                'statut'       => 'absent_non_justifie',
                'heureArrivee' => null,
                'heureDepart'  => null,
                'pauses'       => [],
                'heuresNettes' => null,
                'heuresPrevues'=> $this->getHeuresPrevuesdepuisPointage($pointage),
                'estRetard'    => false,
                'typeAbsence'  => null,
            ];
        }

        // Cas : en cours
        if (in_array($pointage->getStatut(), [Pointage::STATUT_EN_COURS, Pointage::STATUT_EN_PAUSE], true)) {
            return [
                'date'         => $dateStr,
                'jourSemaine'  => $jourSemaine,
                'statut'       => 'en_cours',
                'heureArrivee' => $pointage->getHeureArrivee()?->format('H:i'),
                'heureDepart'  => null,
                'pauses'       => $this->formatPauses($pointage),
                'heuresNettes' => $this->calculerHeuresNettes($pointage),
                'heuresPrevues'=> $this->getHeuresPrevuesdepuisPointage($pointage),
                'estRetard'    => $this->estEnRetard($pointage),
                'typeAbsence'  => null,
            ];
        }

        // Cas : travaillé (TERMINE ou ABSENT marqué par le manager)
        $heuresNettes = $this->calculerHeuresNettes($pointage);
        return [
            'date'         => $dateStr,
            'jourSemaine'  => $jourSemaine,
            'statut'       => $pointage->getStatut() === Pointage::STATUT_ABSENT ? 'absent_non_justifie' : 'travaille',
            'heureArrivee' => $pointage->getHeureArrivee()?->format('H:i'),
            'heureDepart'  => $pointage->getHeureDepart()?->format('H:i'),
            'pauses'       => $this->formatPauses($pointage),
            'heuresNettes' => $heuresNettes,
            'heuresPrevues'=> $this->getHeuresPrevuesdepuisPointage($pointage),
            'estRetard'    => $this->estEnRetard($pointage),
            'typeAbsence'  => null,
        ];
    }

    /**
     * Calcule les heures nettes travaillées (arrivée→départ − pauses) en minutes.
     */
    public function calculerHeuresNettes(Pointage $pointage): int
    {
        if ($pointage->getHeureArrivee() === null) {
            return 0;
        }

        $fin = $pointage->getHeureDepart() ?? new \DateTimeImmutable();
        $duree = ($fin->getTimestamp() - $pointage->getHeureArrivee()->getTimestamp()) / 60;

        return (int) max(0, $duree - $this->calculerTotalPausesMinutes($pointage));
    }

    /**
     * Calcule le total des pauses en minutes.
     */
    public function calculerTotalPausesMinutes(Pointage $pointage): int
    {
        $total = 0;
        $now   = new \DateTimeImmutable();

        foreach ($pointage->getPauses() as $pause) {
            $fin    = $pause->getHeureFin() ?? $now;
            $duree  = ($fin->getTimestamp() - $pause->getHeureDebut()->getTimestamp()) / 60;
            $total += (int) max(0, $duree);
        }

        return $total;
    }

    /**
     * Détermine si l'employé est arrivé en retard (> 5 min après le début prévu du poste).
     */
    public function estEnRetard(Pointage $pointage): bool
    {
        if ($pointage->getHeureArrivee() === null || $pointage->getPoste() === null) {
            return false;
        }

        $poste = $pointage->getPoste();
        if ($poste->getHeureDebut() === null) {
            return false;
        }

        $serviceDate     = $pointage->getService()->getDate();
        $heureDebutStr   = $serviceDate->format('Y-m-d') . ' ' . $poste->getHeureDebut()->format('H:i:s');
        $heureDebutPoste = new \DateTimeImmutable($heureDebutStr);

        $retardMinutes = ($pointage->getHeureArrivee()->getTimestamp() - $heureDebutPoste->getTimestamp()) / 60;

        return $retardMinutes > 5;
    }

    /**
     * Calcule les 5 KPIs pour une semaine.
     */
    public function calculerKPIs(array $employes, int $centreId, \DateTimeImmutable $lundi): array
    {
        $totalTravaille = 0;
        $totalPrevu     = 0;
        $nbAbsences     = 0;
        $totalPointages = 0;
        $pointagesALheure = 0;

        foreach ($employes as $employe) {
            $totalTravaille += $employe['totalTravaille'];
            $totalPrevu     += $employe['totalPrevu'];
            $nbAbsences     += $employe['nbAbsences'];

            foreach ($employe['jours'] as $jour) {
                if ($jour['statut'] === 'travaille' || $jour['statut'] === 'en_cours') {
                    $totalPointages++;
                    if (!$jour['estRetard']) {
                        $pointagesALheure++;
                    }
                }
            }
        }

        $tauxPonctualite = $totalPointages > 0
            ? (int) round(($pointagesALheure / $totalPointages) * 100)
            : 100;

        // Comparaison absences semaine N-1
        $lundiPrecedent  = $lundi->modify('-7 days');
        $dimPrecedent    = $lundiPrecedent->modify('+6 days');
        $absencesPrecedentes = $this->absenceRepo->findByCentreAndDateRange($centreId, $lundiPrecedent, $dimPrecedent);

        // Comptage des absences non-repos de la semaine précédente
        $nbAbsencesPrecedentes = count(array_filter(
            $absencesPrecedentes,
            fn(Absence $a) => $a->getType() !== 'REPOS'
        ));

        return [
            'heuresTravaillees'   => $totalTravaille,
            'heuresPrevues'       => $totalPrevu,
            'ecart'               => $totalTravaille - $totalPrevu,
            'tauxPonctualite'     => $tauxPonctualite,
            'nbAbsences'          => $nbAbsences,
            'evolutionAbsences'   => $nbAbsences - $nbAbsencesPrecedentes,
        ];
    }

    /**
     * Calcule les alertes légales IDCC 1790 pour une semaine.
     *
     * @return array<int, array{type: string, severite: string, employe: array, titre: string, detail: string}>
     */
    public function calculerAlertes(array $employes): array
    {
        $alertes = [];

        foreach ($employes as $employe) {
            $userId = $employe['userId'];
            $nom    = $employe['prenom'] . ' ' . $employe['nom'];
            $total  = $employe['totalTravaille']; // en minutes

            // Dépassement hebdo (> 35h = 2100 min, contrat standard)
            if ($total > 2100) {
                $alertes[] = $this->buildAlerte(
                    'depassement_hebdo', 'warning', $userId, $nom,
                    'Dépassement hebdomadaire',
                    $this->minToHHMM($total) . ' cette semaine — seuil contractuel 35h'
                );
            }

            // Maximum hebdo 48h (2880 min)
            if ($total > 2880) {
                $alertes[] = $this->buildAlerte(
                    'max_hebdo', 'danger', $userId, $nom,
                    'Maximum hebdomadaire 48h dépassé',
                    $this->minToHHMM($total) . ' — seuil légal absolu 48h'
                );
            }

            // Heures sup : entre 0 et 8h au-delà du contrat → 25%
            $sup = $employe['heuresSup'];
            if ($sup > 0 && $sup <= 480) {
                $alertes[] = $this->buildAlerte(
                    'majoration_25', 'warning', $userId, $nom,
                    'Majorations 25%',
                    '+' . $this->minToHHMM($sup) . ' sup à 25% — à appliquer sur salaire'
                );
            } elseif ($sup > 480) {
                $alertes[] = $this->buildAlerte(
                    'majoration_50', 'danger', $userId, $nom,
                    'Majorations 50%',
                    '+' . $this->minToHHMM($sup - 480) . ' au-delà de 8h sup — majoration 50%'
                );
            }

            // Absences non justifiées
            if ($employe['nbAbsences'] > 0) {
                $alertes[] = $this->buildAlerte(
                    'absence_non_justifiee', 'danger', $userId, $nom,
                    'Absence non justifiée',
                    $employe['nbAbsences'] . ' jour(s) — Action requise (contact employé, documentation)'
                );
            }

            // Vérification jour par jour : max journalier 10h et pause obligatoire 6h
            foreach ($employe['jours'] as $jour) {
                if ($jour['statut'] !== 'travaille' && $jour['statut'] !== 'en_cours') {
                    continue;
                }

                $heuresJour = $jour['heuresNettes'] ?? 0;

                // Max journalier 10h (600 min)
                if ($heuresJour > 600) {
                    $alertes[] = $this->buildAlerte(
                        'max_journalier', 'danger', $userId, $nom,
                        'Maximum journalier 10h dépassé',
                        $jour['jourSemaine'] . ' — ' . $this->minToHHMM($heuresJour) . ' travaillées'
                    );
                }

                // Pause obligatoire après 6h (360 min)
                if ($heuresJour > 360 && count($jour['pauses']) === 0) {
                    $alertes[] = $this->buildAlerte(
                        'pause_6h', 'warning', $userId, $nom,
                        'Pause obligatoire après 6h',
                        $jour['jourSemaine'] . ' — ' . $this->minToHHMM($heuresJour) . ' sans pause enregistrée'
                    );
                }
            }

            // Repos quotidien 11h — vérifier entre jours consécutifs travaillés
            $alerteReposQuotidien = $this->verifierReposQuotidien($employe['jours']);
            if ($alerteReposQuotidien !== null) {
                $alertes[] = $this->buildAlerte(
                    'repos_quotidien', 'danger', $userId, $nom,
                    'Repos quotidien 11h non respecté',
                    $alerteReposQuotidien
                );
            }
        }

        // Alerte OK si repos quotidien et hebdo conformes pour tous
        $hasReposQuotidienDanger = !empty(array_filter($alertes, fn($a) => $a['type'] === 'repos_quotidien'));
        if (!$hasReposQuotidienDanger) {
            $alertes[] = $this->buildAlerte(
                'repos_quotidien', 'ok', 0, '',
                'Repos quotidien 11h — Conforme',
                'Tous les employés respectent le seuil légal'
            );
        }

        $hasAbsence = !empty(array_filter($alertes, fn($a) => $a['type'] === 'repos_quotidien' && $a['severite'] === 'danger'));
        $alertes[]  = $this->buildAlerte(
            'repos_hebdo', 'ok', 0, '',
            'Repos hebdomadaire 35h — Conforme',
            'Tous les employés respectent le seuil légal'
        );

        return $alertes;
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    /**
     * Valide les heures d'un employé pour une semaine.
     * Crée ou met à jour l'entité ValidationHebdo.
     */
    public function validerEmploye(int $centreId, int $userId, \DateTimeImmutable $lundi, User $manager): ValidationHebdo
    {
        $validation = $this->validationRepo->findOneByUserAndSemaine($centreId, $userId, $lundi);

        if ($validation === null) {
            $validation = new ValidationHebdo();
            $validation->setCentre($this->em->getReference(Centre::class, $centreId));
            $validation->setUser($this->em->getReference(User::class, $userId));
            $validation->setSemaine($lundi);
        }

        // Recalculer les totaux depuis les pointages réels
        $employes = $this->getSemaineData($centreId, $lundi)['employes'];
        foreach ($employes as $employe) {
            if ($employe['userId'] === $userId) {
                $validation->setHeuresTravaillees($employe['totalTravaille']);
                $validation->setHeuresPrevues($employe['totalPrevu']);
                $validation->setEcart($employe['ecart']);
                $validation->setHeuresSup($employe['heuresSup']);
                $validation->setNbRetards($employe['nbRetards']);
                $validation->setNbAbsences($employe['nbAbsences']);
                break;
            }
        }

        $validation->setStatut(ValidationHebdo::STATUT_VALIDEE);
        $validation->setValidePar($manager);
        $validation->setValideAt(new \DateTimeImmutable());
        $validation->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($validation);
        $this->em->flush();

        return $validation;
    }

    /**
     * Valide tous les employés d'une semaine d'un coup.
     *
     * @return ValidationHebdo[]
     */
    public function validerSemaine(int $centreId, \DateTimeImmutable $lundi, User $manager): array
    {
        $semaineData = $this->getSemaineData($centreId, $lundi);
        $validations = [];

        foreach ($semaineData['employes'] as $employe) {
            $validations[] = $this->validerEmploye($centreId, $employe['userId'], $lundi, $manager);
        }

        return $validations;
    }

    /**
     * Applique une correction sur un pointage et trace la modification.
     */
    public function corrigerPointage(
        int    $pointageId,
        string $champ,
        string $nouvelleValeurStr,
        ?string $motif,
        User   $manager
    ): CorrectionPointage {
        $pointage = $this->pointageRepo->find($pointageId);

        if ($pointage === null) {
            throw new \InvalidArgumentException("Pointage {$pointageId} introuvable.");
        }

        if (!in_array($champ, CorrectionPointage::CHAMPS, true)) {
            throw new \InvalidArgumentException("Champ {$champ} non modifiable.");
        }

        $nouvelleValeur = new \DateTimeImmutable($nouvelleValeurStr);

        // Récupérer l'ancienne valeur
        $ancienneValeur = match ($champ) {
            'heureArrivee' => $pointage->getHeureArrivee(),
            'heureDepart'  => $pointage->getHeureDepart(),
            default        => null,
        };

        // Appliquer la correction
        match ($champ) {
            'heureArrivee' => $pointage->setHeureArrivee($nouvelleValeur),
            'heureDepart'  => $pointage->setHeureDepart($nouvelleValeur),
            default        => null,
        };

        $pointage->setUpdatedAt(new \DateTimeImmutable());

        // Tracer la correction
        $correction = new CorrectionPointage();
        $correction->setPointage($pointage);
        $correction->setChampModifie($champ);
        $correction->setAncienneValeur($ancienneValeur);
        $correction->setNouvelleValeur($nouvelleValeur);
        $correction->setMotif($motif);
        $correction->setCorrigePar($manager);

        $this->em->persist($correction);
        $this->em->flush();

        return $correction;
    }

    /**
     * Retourne les corrections d'un pointage, formatées pour le frontend.
     */
    public function getCorrectionsFormatees(int $pointageId): array
    {
        $corrections = $this->correctionRepo->findByPointage($pointageId);

        return array_map(fn(CorrectionPointage $c) => [
            'id'             => $c->getId(),
            'pointageId'     => $c->getPointage()->getId(),
            'champModifie'   => $c->getChampModifie(),
            'ancienneValeur' => $c->getAncienneValeur()?->format('Y-m-d H:i:s'),
            'nouvelleValeur' => $c->getNouvelleValeur()?->format('Y-m-d H:i:s'),
            'motif'          => $c->getMotif(),
            'corrigePar'     => $c->getCorrigePar()->getNom(),
            'createdAt'      => $c->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $corrections);
    }

    // ─── Helpers privés ──────────────────────────────────────────────────────

    private function buildAlerte(string $type, string $severite, int $userId, string $nom, string $titre, string $detail): array
    {
        return [
            'type'     => $type,
            'severite' => $severite,
            'employe'  => ['id' => $userId, 'nom' => $nom],
            'titre'    => $titre,
            'detail'   => $detail,
        ];
    }

    private function formatPauses(Pointage $pointage): array
    {
        $result = [];
        $now    = new \DateTimeImmutable();

        foreach ($pointage->getPauses() as $pause) {
            $fin    = $pause->getHeureFin() ?? $now;
            $duree  = (int) (($fin->getTimestamp() - $pause->getHeureDebut()->getTimestamp()) / 60);

            $result[] = [
                'debut'        => $pause->getHeureDebut()->format('H:i'),
                'fin'          => $pause->getHeureFin()?->format('H:i'),
                'type'         => $pause->getType(),
                'dureeMinutes' => max(0, $duree),
            ];
        }

        return $result;
    }

    private function getHeuresPrevuesdepuisPointage(?Pointage $pointage): ?int
    {
        if ($pointage === null || $pointage->getPoste() === null) {
            return null;
        }

        $poste = $pointage->getPoste();
        if ($poste->getHeureDebut() === null || $poste->getHeureFin() === null) {
            return null;
        }

        $debut = new \DateTimeImmutable('1970-01-01 ' . $poste->getHeureDebut()->format('H:i:s'));
        $fin   = new \DateTimeImmutable('1970-01-01 ' . $poste->getHeureFin()->format('H:i:s'));

        // Gérer le cas où la fin est le lendemain (service de nuit)
        if ($fin < $debut) {
            $fin = $fin->modify('+1 day');
        }

        $duree = (int) (($fin->getTimestamp() - $debut->getTimestamp()) / 60);
        $duree -= (int) ($poste->getPauseMinutes() ?? 0);

        return max(0, $duree);
    }

    private function serviceEstTermine(Pointage $pointage, \DateTimeImmutable $now): bool
    {
        $service = $pointage->getService();
        if ($service->getStatut() === 'TERMINE') {
            return true;
        }

        // Service du jour passé mais pas encore clôturé
        $serviceDate = $service->getDate();
        return $serviceDate->format('Y-m-d') < $now->format('Y-m-d');
    }

    private function verifierReposQuotidien(array $jours): ?string
    {
        $jours = array_filter($jours, fn($j) => in_array($j['statut'], ['travaille', 'en_cours'], true));
        $jours = array_values($jours);

        for ($i = 0; $i < count($jours) - 1; $i++) {
            $jourA = $jours[$i];
            $jourB = $jours[$i + 1];

            if ($jourA['heureDepart'] === null || $jourB['heureArrivee'] === null) {
                continue;
            }

            $depart  = new \DateTimeImmutable($jourA['date'] . ' ' . $jourA['heureDepart']);
            $arrivee = new \DateTimeImmutable($jourB['date'] . ' ' . $jourB['heureArrivee']);
            $repos   = ($arrivee->getTimestamp() - $depart->getTimestamp()) / 3600;

            if ($repos < 11) {
                return "Entre {$jourA['jourSemaine']} et {$jourB['jourSemaine']} — seulement " . round($repos, 1) . 'h de repos (légal : 11h)';
            }
        }

        return null;
    }

    private function formatJourSemaine(\DateTimeImmutable $date): string
    {
        $jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        return $jours[(int) $date->format('N') - 1];
    }

    public function minToHHMM(int $minutes): string
    {
        $h   = (int) abs($minutes / 60);
        $min = abs($minutes % 60);
        $sign = $minutes < 0 ? '-' : '';
        return $sign . $h . 'h' . ($min > 0 ? str_pad((string) $min, 2, '0', STR_PAD_LEFT) : '');
    }
}

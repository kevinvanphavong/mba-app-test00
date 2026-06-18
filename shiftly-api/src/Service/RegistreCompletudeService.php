<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;

/**
 * Calcule la complétude de la fiche d'un salarié au regard du Registre Unique
 * du Personnel (Art. L1221-13 / D1221-23 C. travail).
 *
 * Source unique de vérité des champs légalement requis. Sert au nudge front
 * « X informations manquantes » (E1).
 */
class RegistreCompletudeService
{
    /**
     * Champs requis au RUP → libellé affiché. L'ordre fait foi pour l'affichage.
     *
     * @var array<string, string>
     */
    private const CHAMPS_REQUIS = [
        'nom' => 'Nom d\'usage',
        'prenom' => 'Prénom',
        'nomNaissance' => 'Nom de naissance',
        'dateNaissance' => 'Date de naissance',
        'sexe' => 'Sexe',
        'nationalite' => 'Nationalité',
        'numeroSecuriteSociale' => 'N° de sécurité sociale',
        'emploi' => 'Emploi / qualification',
        'typeContrat' => 'Type de contrat',
        'dateEmbauche' => 'Date d\'embauche',
    ];

    /**
     * @return array{score: int, total: int, complet: bool, manquants: list<array{champ: string, label: string}>}
     */
    public function evaluer(User $user): array
    {
        $manquants = [];
        foreach (self::CHAMPS_REQUIS as $champ => $label) {
            if ($this->estVide($user, $champ)) {
                $manquants[] = ['champ' => $champ, 'label' => $label];
            }
        }

        $total = \count(self::CHAMPS_REQUIS);
        $score = $total - \count($manquants);

        return [
            'score' => $score,
            'total' => $total,
            'complet' => [] === $manquants,
            'manquants' => $manquants,
        ];
    }

    private function estVide(User $user, string $champ): bool
    {
        $getter = 'get'.ucfirst($champ);
        if (!method_exists($user, $getter)) {
            return true;
        }

        $valeur = $user->{$getter}();

        if (null === $valeur) {
            return true;
        }

        return \is_string($valeur) && '' === trim($valeur);
    }
}

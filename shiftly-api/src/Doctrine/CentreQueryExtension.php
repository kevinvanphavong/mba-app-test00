<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Absence;
use App\Entity\Avis;
use App\Entity\Centre;
use App\Entity\Competence;
use App\Entity\Completion;
use App\Entity\CompletionHaccpProof;
use App\Entity\Contact;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use App\Entity\EventLog;
use App\Entity\HaccpEquipement;
use App\Entity\Incident;
use App\Entity\LegalConfig;
use App\Entity\Mission;
use App\Entity\MissionCategorie;
use App\Entity\MissionHaccpSpec;
use App\Entity\PlanningSnapshot;
use App\Entity\PlanningWeek;
use App\Entity\Pointage;
use App\Entity\PointageCorrection;
use App\Entity\PointagePause;
use App\Entity\Poste;
use App\Entity\Prestation;
use App\Entity\Relance;
use App\Entity\Reservation;
use App\Entity\Service;
use App\Entity\StaffCompetence;
use App\Entity\TutoRead;
use App\Entity\Tutoriel;
use App\Entity\User;
use App\Entity\Zone;
use App\Service\CurrentCentreResolver;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Filtre automatiquement toutes les collections/items API Platform par le centre
 * courant. Garantit l'isolation multi-tenant au niveau BDD (CLAUDE.md règle 9).
 *
 * **Fail-closed** : le centre courant est résolu par {@see CurrentCentreResolver}
 * (JWT puis domaine). Si aucun centre n'est résolu, la requête est ramenée à un
 * jeu de résultats VIDE (et non « pas de filtre ») : jamais de fuite cross-tenant
 * par absence de centre. Seul le ROLE_SUPERADMIN, global par nature, n'est pas filtré.
 */
final class CentreQueryExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
        private readonly CurrentCentreResolver $centreResolver,
    ) {
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->apply($queryBuilder, $resourceClass, $queryNameGenerator);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->apply($queryBuilder, $resourceClass, $queryNameGenerator);
    }

    private function apply(
        QueryBuilder $queryBuilder,
        string $resourceClass,
        QueryNameGeneratorInterface $queryNameGenerator,
    ): void {
        // Le SUPERADMIN opère légitimement sur tous les centres (accès global) :
        // jamais filtré. C'est la seule dérogation à l'isolation par centre.
        if ($this->security->isGranted('ROLE_SUPERADMIN')) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $centre = $this->centreResolver->resolve();

        // Fail-closed : aucun centre résolu (ni JWT ni domaine) → résultat vide.
        // On ne « laisse pas passer » : une requête sans tenant ne voit RIEN.
        if (null === $centre) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }

        $paramName = $queryNameGenerator->generateParameterName('centreId');
        $centreId = $centre->getId();

        // Le Centre n'est accessible qu'à lui-même : on filtre la collection/item
        // sur l'id du centre du user (sinon GET /centres listerait TOUS les tenants).
        if (Centre::class === $resourceClass) {
            $queryBuilder
                ->andWhere("{$alias}.id = :{$paramName}")
                ->setParameter($paramName, $centreId);

            return;
        }

        match (true) {
            // Entités avec une relation `centre` directe
            in_array($resourceClass, [
                Zone::class,
                Tutoriel::class,
                User::class,
                Service::class,
                Incident::class,
                LegalConfig::class,
                MissionCategorie::class,
                PlanningWeek::class,
                PlanningSnapshot::class,
                Pointage::class,
                PointageCorrection::class,
                Absence::class,
                EventLog::class,
                HaccpEquipement::class,
                MissionHaccpSpec::class,
                CompletionHaccpProof::class,
                DemandeB2B::class,
                Devis::class,
                Contact::class,
                Avis::class,
                Relance::class,
                Reservation::class,
                Prestation::class,
            ], true) => $queryBuilder
                ->andWhere("{$alias}.centre = :{$paramName}")
                ->setParameter($paramName, $centreId),

            // Entités via zone → centre
            in_array($resourceClass, [Mission::class, Competence::class], true) => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $zoneAlias = $queryNameGenerator->generateJoinAlias('zone');
                $queryBuilder
                    ->innerJoin("{$alias}.zone", $zoneAlias)
                    ->andWhere("{$zoneAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // Poste via service → centre
            Poste::class === $resourceClass => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $svcAlias = $queryNameGenerator->generateJoinAlias('service');
                $queryBuilder
                    ->innerJoin("{$alias}.service", $svcAlias)
                    ->andWhere("{$svcAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // StaffCompetence via user → centre
            StaffCompetence::class === $resourceClass => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $userAlias = $queryNameGenerator->generateJoinAlias('user');
                $queryBuilder
                    ->innerJoin("{$alias}.user", $userAlias)
                    ->andWhere("{$userAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // TutoRead via user → centre
            TutoRead::class === $resourceClass => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $userAlias = $queryNameGenerator->generateJoinAlias('user');
                $queryBuilder
                    ->innerJoin("{$alias}.user", $userAlias)
                    ->andWhere("{$userAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // Completion via poste → service → centre
            Completion::class === $resourceClass => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $posteAlias = $queryNameGenerator->generateJoinAlias('poste');
                $svcAlias = $queryNameGenerator->generateJoinAlias('service');
                $queryBuilder
                    ->innerJoin("{$alias}.poste", $posteAlias)
                    ->innerJoin("{$posteAlias}.service", $svcAlias)
                    ->andWhere("{$svcAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // PointagePause via pointage → centre
            PointagePause::class === $resourceClass => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $pointageAlias = $queryNameGenerator->generateJoinAlias('pointage');
                $queryBuilder
                    ->innerJoin("{$alias}.pointage", $pointageAlias)
                    ->andWhere("{$pointageAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            default => null,
        };
    }
}

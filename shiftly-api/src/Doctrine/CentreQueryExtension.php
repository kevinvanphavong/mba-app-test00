<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Absence;
use App\Entity\Centre;
use App\Entity\Competence;
use App\Entity\Completion;
use App\Entity\Incident;
use App\Entity\LegalConfig;
use App\Entity\Mission;
use App\Entity\PlanningSnapshot;
use App\Entity\PlanningWeek;
use App\Entity\Pointage;
use App\Entity\PointageCorrection;
use App\Entity\PointagePause;
use App\Entity\Poste;
use App\Entity\Service;
use App\Entity\StaffCompetence;
use App\Entity\TutoRead;
use App\Entity\Tutoriel;
use App\Entity\User;
use App\Entity\Zone;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Filtre automatiquement toutes les collections API Platform par le centre
 * de l'utilisateur connecté. Garantit l'isolation multi-tenant au niveau BDD.
 */
final class CentreQueryExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(private readonly Security $security) {}

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = []
    ): void {
        $this->apply($queryBuilder, $resourceClass, $queryNameGenerator);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = []
    ): void {
        $this->apply($queryBuilder, $resourceClass, $queryNameGenerator);
    }

    private function apply(
        QueryBuilder $queryBuilder,
        string $resourceClass,
        QueryNameGeneratorInterface $queryNameGenerator
    ): void {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return;
        }

        $centre = $user->getCentre();
        if (!$centre) {
            return;
        }

        // Le centre lui-même n'est pas filtré (un user a accès à son propre Centre)
        if ($resourceClass === Centre::class) {
            return;
        }

        $alias    = $queryBuilder->getRootAliases()[0];
        $paramName = $queryNameGenerator->generateParameterName('centreId');
        $centreId  = $centre->getId();

        match (true) {
            // Entités avec une relation `centre` directe
            in_array($resourceClass, [
                Zone::class,
                Tutoriel::class,
                User::class,
                Service::class,
                Incident::class,
                LegalConfig::class,
                PlanningWeek::class,
                PlanningSnapshot::class,
                Pointage::class,
                PointageCorrection::class,
                Absence::class,
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
            $resourceClass === Poste::class => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $svcAlias = $queryNameGenerator->generateJoinAlias('service');
                $queryBuilder
                    ->innerJoin("{$alias}.service", $svcAlias)
                    ->andWhere("{$svcAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // StaffCompetence via user → centre
            $resourceClass === StaffCompetence::class => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $userAlias = $queryNameGenerator->generateJoinAlias('user');
                $queryBuilder
                    ->innerJoin("{$alias}.user", $userAlias)
                    ->andWhere("{$userAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // TutoRead via user → centre
            $resourceClass === TutoRead::class => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $userAlias = $queryNameGenerator->generateJoinAlias('user');
                $queryBuilder
                    ->innerJoin("{$alias}.user", $userAlias)
                    ->andWhere("{$userAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // Completion via poste → service → centre
            $resourceClass === Completion::class => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
                $posteAlias = $queryNameGenerator->generateJoinAlias('poste');
                $svcAlias   = $queryNameGenerator->generateJoinAlias('service');
                $queryBuilder
                    ->innerJoin("{$alias}.poste", $posteAlias)
                    ->innerJoin("{$posteAlias}.service", $svcAlias)
                    ->andWhere("{$svcAlias}.centre = :{$paramName}")
                    ->setParameter($paramName, $centreId);
            })(),

            // PointagePause via pointage → centre
            $resourceClass === PointagePause::class => (function () use ($queryBuilder, $alias, $paramName, $centreId, $queryNameGenerator): void {
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

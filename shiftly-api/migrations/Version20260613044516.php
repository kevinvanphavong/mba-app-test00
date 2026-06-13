<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Créneaux multiples d'une même personne dans une même zone (créneau coupé) :
 * l'index unique `uniq_poste` passe de (service, zone, user) à
 * (service, zone, user, heure_debut) avec NULLS NOT DISTINCT (Postgres 15+).
 *
 * → 2 postes même user/zone avec horaires différents = autorisés.
 * → même horaire (ou 2 fois "sans horaire" = NULL) = bloqués (NULLS NOT DISTINCT
 *   traite les NULL comme égaux, fermant la faille des NULL distincts).
 */
final class Version20260613044516 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'uniq_poste + heure_debut (créneaux multiples, NULLS NOT DISTINCT)';
    }

    public function up(Schema $schema): void
    {
        // Garde-fou : si des doublons EXACTS préexistent (même service+zone+user+heure_debut,
        // NULL compris car GROUP BY traite les NULL comme égaux), la création de l'index
        // unique échouerait. On bloque la migration en les signalant — sans rien écraser.
        $dupes = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM (
                SELECT 1 FROM poste
                GROUP BY service_id, zone_id, user_id, heure_debut
                HAVING COUNT(*) > 1
             ) d'
        );
        $this->abortIf(
            $dupes > 0,
            sprintf(
                '%d doublon(s) exact(s) de poste (service+zone+user+heure_debut) détecté(s). '
                .'Nettoie-les manuellement avant de rejouer cette migration — aucune donnée n\'a été écrasée.',
                $dupes
            )
        );

        $this->addSql('DROP INDEX uniq_poste');
        $this->addSql('CREATE UNIQUE INDEX uniq_poste ON poste (service_id, zone_id, user_id, heure_debut) NULLS NOT DISTINCT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_poste');
        $this->addSql('CREATE UNIQUE INDEX uniq_poste ON poste (service_id, zone_id, user_id)');
    }
}

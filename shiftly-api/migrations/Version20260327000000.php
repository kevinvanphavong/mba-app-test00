<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration : remplace le champ zone (string) par une clé étrangère zone_id sur la table tutoriel.
 * Les tutoriels existants sont liés à la zone correspondante (par nom) dans le même centre.
 * Si aucune correspondance, zone_id reste NULL (tutoriel général).
 */
final class Version20260327000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Tutoriel.zone string → ManyToOne(Zone) nullable FK';
    }

    public function up(Schema $schema): void
    {
        // Ajout de la colonne FK (SQLite ne supporte pas ADD CONSTRAINT via ALTER TABLE)
        $this->addSql('ALTER TABLE tutoriel ADD COLUMN zone_id INTEGER DEFAULT NULL');

        // Migration des données : sous-requête compatible SQLite
        $this->addSql('
            UPDATE tutoriel
            SET zone_id = (
                SELECT z.id FROM zone z
                WHERE z.nom = tutoriel.zone AND z.centre_id = tutoriel.centre_id
                LIMIT 1
            )
            WHERE tutoriel.zone IS NOT NULL
        ');

        // Suppression de l'ancienne colonne (SQLite 3.35+)
        $this->addSql('ALTER TABLE tutoriel DROP COLUMN zone');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tutoriel ADD COLUMN zone VARCHAR(255) DEFAULT NULL');

        $this->addSql('
            UPDATE tutoriel
            SET zone = (
                SELECT z.nom FROM zone z
                WHERE z.id = tutoriel.zone_id
                LIMIT 1
            )
            WHERE tutoriel.zone_id IS NOT NULL
        ');

        $this->addSql('ALTER TABLE tutoriel DROP COLUMN zone_id');
    }
}

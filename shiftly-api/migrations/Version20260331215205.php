<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260331215205 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE centre ADD COLUMN adresse VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD COLUMN telephone VARCHAR(30) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD COLUMN site_web VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, centre_id INTEGER NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, note CLOB DEFAULT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note) SELECT id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__centre AS SELECT id, nom, slug, opening_hours, created_at FROM centre');
        $this->addSql('DROP TABLE centre');
        $this->addSql('CREATE TABLE centre (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, slug VARCHAR(120) NOT NULL, opening_hours CLOB DEFAULT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO centre (id, nom, slug, opening_hours, created_at) SELECT id, nom, slug, opening_hours, created_at FROM __temp__centre');
        $this->addSql('DROP TABLE __temp__centre');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C6A0EA75989D9B62 ON centre (slug)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT \'0\' NOT NULL, note CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
    }
}

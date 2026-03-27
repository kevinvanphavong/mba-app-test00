<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260325221744 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__mission AS SELECT id, texte, type, priorite, ordre, zone_id FROM mission');
        $this->addSql('DROP TABLE mission');
        $this->addSql('CREATE TABLE mission (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, texte VARCHAR(255) NOT NULL, categorie VARCHAR(30) NOT NULL, priorite VARCHAR(30) NOT NULL, ordre INTEGER NOT NULL, zone_id INTEGER NOT NULL, frequence VARCHAR(20) NOT NULL, service_id INTEGER DEFAULT NULL, CONSTRAINT FK_9067F23C9F2C3FAB FOREIGN KEY (zone_id) REFERENCES zone (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_9067F23CED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql("INSERT INTO mission (id, texte, categorie, frequence, priorite, ordre, zone_id) SELECT id, texte, type, 'FIXE', priorite, ordre, zone_id FROM __temp__mission");
        $this->addSql('DROP TABLE __temp__mission');
        $this->addSql('CREATE INDEX IDX_9067F23C9F2C3FAB ON mission (zone_id)');
        $this->addSql('CREATE INDEX IDX_9067F23CED5CA9E6 ON mission (service_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, centre_id INTEGER NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, centre_id) SELECT id, date, heure_debut, heure_fin, statut, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__mission AS SELECT id, texte, categorie, priorite, ordre, zone_id FROM mission');
        $this->addSql('DROP TABLE mission');
        $this->addSql('CREATE TABLE mission (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, texte VARCHAR(255) NOT NULL, type VARCHAR(30) NOT NULL, priorite VARCHAR(30) NOT NULL, ordre INTEGER NOT NULL, zone_id INTEGER NOT NULL, CONSTRAINT FK_9067F23C9F2C3FAB FOREIGN KEY (zone_id) REFERENCES zone (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO mission (id, texte, type, priorite, ordre, zone_id) SELECT id, texte, categorie, priorite, ordre, zone_id FROM __temp__mission');
        $this->addSql('DROP TABLE __temp__mission');
        $this->addSql('CREATE INDEX IDX_9067F23C9F2C3FAB ON mission (zone_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, centre_id) SELECT id, date, heure_debut, heure_fin, statut, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
    }
}

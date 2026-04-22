<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422195355 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "action" VARCHAR(100) NOT NULL, target_type VARCHAR(50) NOT NULL, target_id INTEGER DEFAULT NULL, metadata CLOB DEFAULT NULL, ip VARCHAR(45) DEFAULT NULL, user_agent VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, super_admin_user_id INTEGER NOT NULL, CONSTRAINT FK_F6E1C0F5B8CD8675 FOREIGN KEY (super_admin_user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_F6E1C0F5B8CD8675 ON audit_log (super_admin_user_id)');
        $this->addSql('CREATE TABLE centre_note (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, contenu CLOB NOT NULL, created_at DATETIME NOT NULL, centre_id INTEGER NOT NULL, super_admin_user_id INTEGER NOT NULL, CONSTRAINT FK_5EB06944463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_5EB06944B8CD8675 FOREIGN KEY (super_admin_user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_5EB06944463CD7C3 ON centre_note (centre_id)');
        $this->addSql('CREATE INDEX IDX_5EB06944B8CD8675 ON centre_note (super_admin_user_id)');
        $this->addSql('DROP TABLE legal_config');
        $this->addSql('DROP TABLE pointage_correction');
        $this->addSql('ALTER TABLE centre ADD COLUMN actif BOOLEAN DEFAULT 1 NOT NULL');
        $this->addSql('CREATE TEMPORARY TABLE __temp__pointage AS SELECT id, centre_id, service_id, poste_id, user_id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at FROM pointage');
        $this->addSql('DROP TABLE pointage');
        $this->addSql('CREATE TABLE pointage (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, centre_id INTEGER NOT NULL, service_id INTEGER NOT NULL, poste_id INTEGER DEFAULT NULL, user_id INTEGER NOT NULL, heure_arrivee DATETIME DEFAULT NULL, heure_depart DATETIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, commentaire CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, CONSTRAINT FK_pointage_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_pointage_service FOREIGN KEY (service_id) REFERENCES service (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_pointage_poste FOREIGN KEY (poste_id) REFERENCES poste (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_pointage_user FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO pointage (id, centre_id, service_id, poste_id, user_id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at) SELECT id, centre_id, service_id, poste_id, user_id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at FROM __temp__pointage');
        $this->addSql('DROP TABLE __temp__pointage');
        $this->addSql('CREATE INDEX idx_pointage_centre_service ON pointage (centre_id, service_id)');
        $this->addSql('CREATE INDEX IDX_7591B20463CD7C3 ON pointage (centre_id)');
        $this->addSql('CREATE INDEX IDX_7591B20ED5CA9E6 ON pointage (service_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A0905086 ON pointage (poste_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A76ED395 ON pointage (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, note CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, missions_snapshot CLOB DEFAULT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__validation_hebdo AS SELECT id, centre_id, user_id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_par_id, valide_at, created_at, updated_at FROM validation_hebdo');
        $this->addSql('DROP TABLE validation_hebdo');
        $this->addSql('CREATE TABLE validation_hebdo (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, centre_id INTEGER NOT NULL, user_id INTEGER NOT NULL, semaine DATE NOT NULL, statut VARCHAR(20) NOT NULL, heures_travaillees INTEGER NOT NULL, heures_prevues INTEGER NOT NULL, ecart INTEGER NOT NULL, heures_sup INTEGER NOT NULL, nb_retards INTEGER NOT NULL, nb_absences INTEGER NOT NULL, commentaire CLOB DEFAULT NULL, valide_par_id INTEGER DEFAULT NULL, valide_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, CONSTRAINT FK_vh_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_vh_user FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_vh_valide_par FOREIGN KEY (valide_par_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO validation_hebdo (id, centre_id, user_id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_par_id, valide_at, created_at, updated_at) SELECT id, centre_id, user_id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_par_id, valide_at, created_at, updated_at FROM __temp__validation_hebdo');
        $this->addSql('DROP TABLE __temp__validation_hebdo');
        $this->addSql('CREATE UNIQUE INDEX uniq_validation_centre_user_semaine ON validation_hebdo (centre_id, user_id, semaine)');
        $this->addSql('CREATE INDEX IDX_1C440497463CD7C3 ON validation_hebdo (centre_id)');
        $this->addSql('CREATE INDEX IDX_1C440497A76ED395 ON validation_hebdo (user_id)');
        $this->addSql('CREATE INDEX IDX_1C4404976AF12ED9 ON validation_hebdo (valide_par_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE legal_config (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, seuil_retard_minutes INTEGER DEFAULT 5 NOT NULL, duree_legale_hebdo_heures INTEGER DEFAULT 35 NOT NULL, max_heures_hebdo INTEGER DEFAULT 48 NOT NULL, max_heures_moyennes12sem INTEGER DEFAULT 44 NOT NULL, repos_quotidien_heures INTEGER DEFAULT 11 NOT NULL, repos_hebdo_heures INTEGER DEFAULT 35 NOT NULL, majoration_sup_taux1 INTEGER DEFAULT 25 NOT NULL, majoration_sup_taux2 INTEGER DEFAULT 50 NOT NULL, updated_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, updated_by_id INTEGER DEFAULT NULL, CONSTRAINT FK_38BCF507463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_38BCF507896DBBDE FOREIGN KEY (updated_by_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_38BCF507896DBBDE ON legal_config (updated_by_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_38BCF507463CD7C3 ON legal_config (centre_id)');
        $this->addSql('CREATE TABLE pointage_correction (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, ancienne_valeur CLOB NOT NULL COLLATE "BINARY", nouvelle_valeur CLOB NOT NULL COLLATE "BINARY", motif CLOB NOT NULL COLLATE "BINARY", correcte_at DATETIME NOT NULL, pointage_id INTEGER NOT NULL, correcte_par_id INTEGER NOT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_4C305A3CE58DA11D FOREIGN KEY (pointage_id) REFERENCES pointage (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_4C305A3C40CCC65E FOREIGN KEY (correcte_par_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_4C305A3C463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_4C305A3C463CD7C3 ON pointage_correction (centre_id)');
        $this->addSql('CREATE INDEX IDX_4C305A3C40CCC65E ON pointage_correction (correcte_par_id)');
        $this->addSql('CREATE INDEX IDX_4C305A3CE58DA11D ON pointage_correction (pointage_id)');
        $this->addSql('DROP TABLE audit_log');
        $this->addSql('DROP TABLE centre_note');
        $this->addSql('CREATE TEMPORARY TABLE __temp__centre AS SELECT id, nom, slug, adresse, telephone, site_web, opening_hours, created_at FROM centre');
        $this->addSql('DROP TABLE centre');
        $this->addSql('CREATE TABLE centre (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, slug VARCHAR(120) NOT NULL, adresse VARCHAR(255) DEFAULT NULL, telephone VARCHAR(30) DEFAULT NULL, site_web VARCHAR(255) DEFAULT NULL, opening_hours CLOB DEFAULT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO centre (id, nom, slug, adresse, telephone, site_web, opening_hours, created_at) SELECT id, nom, slug, adresse, telephone, site_web, opening_hours, created_at FROM __temp__centre');
        $this->addSql('DROP TABLE __temp__centre');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C6A0EA75989D9B62 ON centre (slug)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__pointage AS SELECT id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id FROM pointage');
        $this->addSql('DROP TABLE pointage');
        $this->addSql('CREATE TABLE pointage (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, heure_arrivee DATETIME DEFAULT NULL, heure_depart DATETIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, commentaire CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, service_id INTEGER NOT NULL, poste_id INTEGER DEFAULT NULL, user_id INTEGER NOT NULL, statut_validation VARCHAR(20) NOT NULL, valide_at DATETIME DEFAULT NULL, valide_par_id INTEGER DEFAULT NULL, CONSTRAINT FK_7591B20463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20A0905086 FOREIGN KEY (poste_id) REFERENCES poste (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B206AF12ED9 FOREIGN KEY (valide_par_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO pointage (id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id) SELECT id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id FROM __temp__pointage');
        $this->addSql('DROP TABLE __temp__pointage');
        $this->addSql('CREATE INDEX IDX_7591B20463CD7C3 ON pointage (centre_id)');
        $this->addSql('CREATE INDEX IDX_7591B20ED5CA9E6 ON pointage (service_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A0905086 ON pointage (poste_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A76ED395 ON pointage (user_id)');
        $this->addSql('CREATE INDEX idx_pointage_centre_service ON pointage (centre_id, service_id)');
        $this->addSql('CREATE INDEX IDX_7591B206AF12ED9 ON pointage (valide_par_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT \'0\' NOT NULL, note CLOB DEFAULT NULL, missions_snapshot CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__validation_hebdo AS SELECT id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_at, created_at, updated_at, centre_id, user_id, valide_par_id FROM validation_hebdo');
        $this->addSql('DROP TABLE validation_hebdo');
        $this->addSql('CREATE TABLE validation_hebdo (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, semaine DATE NOT NULL, statut VARCHAR(20) DEFAULT \'EN_ATTENTE\' NOT NULL, heures_travaillees INTEGER DEFAULT 0 NOT NULL, heures_prevues INTEGER DEFAULT 0 NOT NULL, ecart INTEGER DEFAULT 0 NOT NULL, heures_sup INTEGER DEFAULT 0 NOT NULL, nb_retards INTEGER DEFAULT 0 NOT NULL, nb_absences INTEGER DEFAULT 0 NOT NULL, commentaire CLOB DEFAULT NULL, valide_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, user_id INTEGER NOT NULL, valide_par_id INTEGER DEFAULT NULL, CONSTRAINT FK_1C440497463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1C440497A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1C4404976AF12ED9 FOREIGN KEY (valide_par_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO validation_hebdo (id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_at, created_at, updated_at, centre_id, user_id, valide_par_id) SELECT id, semaine, statut, heures_travaillees, heures_prevues, ecart, heures_sup, nb_retards, nb_absences, commentaire, valide_at, created_at, updated_at, centre_id, user_id, valide_par_id FROM __temp__validation_hebdo');
        $this->addSql('DROP TABLE __temp__validation_hebdo');
        $this->addSql('CREATE INDEX IDX_1C440497463CD7C3 ON validation_hebdo (centre_id)');
        $this->addSql('CREATE INDEX IDX_1C440497A76ED395 ON validation_hebdo (user_id)');
        $this->addSql('CREATE INDEX IDX_1C4404976AF12ED9 ON validation_hebdo (valide_par_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_validation_centre_user_semaine ON validation_hebdo (centre_id, user_id, semaine)');
    }
}

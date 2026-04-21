<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260421011520 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__absence AS SELECT id, centre_id, user_id, date, type, motif, created_at, created_by FROM absence');
        $this->addSql('DROP TABLE absence');
        $this->addSql('CREATE TABLE absence (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, centre_id INTEGER NOT NULL, user_id INTEGER NOT NULL, date DATE NOT NULL, type VARCHAR(30) NOT NULL, motif VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, created_by INTEGER DEFAULT NULL, CONSTRAINT FK_absence_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_absence_user FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_absence_created_by FOREIGN KEY (created_by) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO absence (id, centre_id, user_id, date, type, motif, created_at, created_by) SELECT id, centre_id, user_id, date, type, motif, created_at, created_by FROM __temp__absence');
        $this->addSql('DROP TABLE __temp__absence');
        $this->addSql('CREATE UNIQUE INDEX uniq_absence_user_date ON absence (user_id, date)');
        $this->addSql('CREATE INDEX IDX_765AE0C9DE12AB56 ON absence (created_by)');
        $this->addSql('CREATE INDEX IDX_765AE0C9463CD7C3 ON absence (centre_id)');
        $this->addSql('CREATE INDEX IDX_765AE0C9A76ED395 ON absence (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__planning_snapshot AS SELECT id, centre_id, week_start, published_at, published_by, data, motif_modification, checksum, delai_respect FROM planning_snapshot');
        $this->addSql('DROP TABLE planning_snapshot');
        $this->addSql('CREATE TABLE planning_snapshot (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, centre_id INTEGER NOT NULL, week_start DATE NOT NULL, published_at DATETIME NOT NULL, published_by INTEGER NOT NULL, data CLOB NOT NULL, motif_modification CLOB DEFAULT NULL, checksum VARCHAR(64) NOT NULL, delai_respect BOOLEAN NOT NULL, CONSTRAINT FK_ps_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_ps_published_by FOREIGN KEY (published_by) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO planning_snapshot (id, centre_id, week_start, published_at, published_by, data, motif_modification, checksum, delai_respect) SELECT id, centre_id, week_start, published_at, published_by, data, motif_modification, checksum, delai_respect FROM __temp__planning_snapshot');
        $this->addSql('DROP TABLE __temp__planning_snapshot');
        $this->addSql('CREATE INDEX idx_ps_centre_week ON planning_snapshot (centre_id, week_start)');
        $this->addSql('CREATE INDEX IDX_1B484398463CD7C3 ON planning_snapshot (centre_id)');
        $this->addSql('CREATE INDEX IDX_1B484398B548D29F ON planning_snapshot (published_by)');
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
        $this->addSql('CREATE TEMPORARY TABLE __temp__pointage_pause AS SELECT id, pointage_id, heure_debut, heure_fin, type FROM pointage_pause');
        $this->addSql('DROP TABLE pointage_pause');
        $this->addSql('CREATE TABLE pointage_pause (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, pointage_id INTEGER NOT NULL, heure_debut DATETIME NOT NULL, heure_fin DATETIME DEFAULT NULL, type VARCHAR(20) NOT NULL, CONSTRAINT FK_pause_pointage FOREIGN KEY (pointage_id) REFERENCES pointage (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO pointage_pause (id, pointage_id, heure_debut, heure_fin, type) SELECT id, pointage_id, heure_debut, heure_fin, type FROM __temp__pointage_pause');
        $this->addSql('DROP TABLE __temp__pointage_pause');
        $this->addSql('CREATE INDEX IDX_FE748B79E58DA11D ON pointage_pause (pointage_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, note CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, missions_snapshot CLOB DEFAULT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, centre_id, code_pointage FROM user');
        $this->addSql('DROP TABLE user');
        $this->addSql('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles CLOB NOT NULL, role VARCHAR(20) NOT NULL, avatar_color VARCHAR(20) DEFAULT NULL, points INTEGER NOT NULL, created_at DATETIME NOT NULL, prenom VARCHAR(100) DEFAULT NULL, taille_haut VARCHAR(10) DEFAULT NULL, taille_bas VARCHAR(10) DEFAULT NULL, pointure VARCHAR(10) DEFAULT NULL, actif BOOLEAN DEFAULT 1 NOT NULL, heures_hebdo INTEGER DEFAULT NULL, type_contrat VARCHAR(30) DEFAULT NULL, centre_id INTEGER NOT NULL, code_pointage VARCHAR(4) DEFAULT NULL, CONSTRAINT FK_8D93D649463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO user (id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, centre_id, code_pointage) SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, centre_id, code_pointage FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE INDEX IDX_8D93D649463CD7C3 ON user (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON user (email)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__absence AS SELECT id, date, type, motif, created_at, centre_id, user_id, created_by FROM absence');
        $this->addSql('DROP TABLE absence');
        $this->addSql('CREATE TABLE absence (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, type VARCHAR(30) NOT NULL, motif VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, centre_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_by INTEGER DEFAULT NULL, CONSTRAINT FK_765AE0C9463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_765AE0C9A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_765AE0C9DE12AB56 FOREIGN KEY (created_by) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO absence (id, date, type, motif, created_at, centre_id, user_id, created_by) SELECT id, date, type, motif, created_at, centre_id, user_id, created_by FROM __temp__absence');
        $this->addSql('DROP TABLE __temp__absence');
        $this->addSql('CREATE INDEX IDX_765AE0C9DE12AB56 ON absence (created_by)');
        $this->addSql('CREATE UNIQUE INDEX uniq_absence_user_date ON absence (user_id, date)');
        $this->addSql('CREATE INDEX idx_absence_date ON absence (date)');
        $this->addSql('CREATE INDEX idx_absence_user ON absence (user_id)');
        $this->addSql('CREATE INDEX idx_absence_centre ON absence (centre_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__planning_snapshot AS SELECT id, week_start, published_at, data, motif_modification, checksum, delai_respect, centre_id, published_by FROM planning_snapshot');
        $this->addSql('DROP TABLE planning_snapshot');
        $this->addSql('CREATE TABLE planning_snapshot (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, week_start DATE NOT NULL, published_at DATETIME NOT NULL, data CLOB NOT NULL, motif_modification CLOB DEFAULT NULL, checksum VARCHAR(64) NOT NULL, delai_respect BOOLEAN DEFAULT 1 NOT NULL, centre_id INTEGER NOT NULL, published_by INTEGER NOT NULL, CONSTRAINT FK_1B484398463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1B484398B548D29F FOREIGN KEY (published_by) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO planning_snapshot (id, week_start, published_at, data, motif_modification, checksum, delai_respect, centre_id, published_by) SELECT id, week_start, published_at, data, motif_modification, checksum, delai_respect, centre_id, published_by FROM __temp__planning_snapshot');
        $this->addSql('DROP TABLE __temp__planning_snapshot');
        $this->addSql('CREATE INDEX IDX_1B484398463CD7C3 ON planning_snapshot (centre_id)');
        $this->addSql('CREATE INDEX idx_ps_centre_week ON planning_snapshot (centre_id, week_start)');
        $this->addSql('CREATE INDEX idx_ps_published_by ON planning_snapshot (published_by)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__pointage AS SELECT id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id FROM pointage');
        $this->addSql('DROP TABLE pointage');
        $this->addSql('CREATE TABLE pointage (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, heure_arrivee DATETIME DEFAULT NULL, heure_depart DATETIME DEFAULT NULL, statut VARCHAR(20) DEFAULT \'PREVU\' NOT NULL, commentaire CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, service_id INTEGER NOT NULL, poste_id INTEGER DEFAULT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_7591B20463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20ED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20A0905086 FOREIGN KEY (poste_id) REFERENCES poste (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7591B20A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO pointage (id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id) SELECT id, heure_arrivee, heure_depart, statut, commentaire, created_at, updated_at, centre_id, service_id, poste_id, user_id FROM __temp__pointage');
        $this->addSql('DROP TABLE __temp__pointage');
        $this->addSql('CREATE INDEX IDX_7591B20463CD7C3 ON pointage (centre_id)');
        $this->addSql('CREATE INDEX IDX_7591B20ED5CA9E6 ON pointage (service_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A0905086 ON pointage (poste_id)');
        $this->addSql('CREATE INDEX IDX_7591B20A76ED395 ON pointage (user_id)');
        $this->addSql('CREATE INDEX idx_pointage_centre_service ON pointage (centre_id, service_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__pointage_pause AS SELECT id, heure_debut, heure_fin, type, pointage_id FROM pointage_pause');
        $this->addSql('DROP TABLE pointage_pause');
        $this->addSql('CREATE TABLE pointage_pause (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, heure_debut DATETIME NOT NULL, heure_fin DATETIME DEFAULT NULL, type VARCHAR(20) DEFAULT \'COURTE\' NOT NULL, pointage_id INTEGER NOT NULL, CONSTRAINT FK_FE748B79E58DA11D FOREIGN KEY (pointage_id) REFERENCES pointage (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO pointage_pause (id, heure_debut, heure_fin, type, pointage_id) SELECT id, heure_debut, heure_fin, type, pointage_id FROM __temp__pointage_pause');
        $this->addSql('DROP TABLE __temp__pointage_pause');
        $this->addSql('CREATE INDEX IDX_FE748B79E58DA11D ON pointage_pause (pointage_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT \'0\' NOT NULL, note CLOB DEFAULT NULL, missions_snapshot CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, missions_snapshot, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, code_pointage, centre_id FROM "user"');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles CLOB NOT NULL, role VARCHAR(20) NOT NULL, avatar_color VARCHAR(20) DEFAULT NULL, points INTEGER NOT NULL, created_at DATETIME NOT NULL, prenom VARCHAR(100) DEFAULT NULL, taille_haut VARCHAR(10) DEFAULT NULL, taille_bas VARCHAR(10) DEFAULT NULL, pointure VARCHAR(10) DEFAULT NULL, actif BOOLEAN DEFAULT 1 NOT NULL, heures_hebdo INTEGER DEFAULT NULL, type_contrat VARCHAR(30) DEFAULT NULL, code_pointage VARCHAR(4) DEFAULT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_8D93D649463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO "user" (id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, code_pointage, centre_id) SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, heures_hebdo, type_contrat, code_pointage, centre_id FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('CREATE INDEX IDX_8D93D649463CD7C3 ON "user" (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_user_centre_code ON "user" (centre_id, code_pointage)');
    }
}

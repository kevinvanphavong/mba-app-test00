<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260331023134 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE incident_staff (incident_id INTEGER NOT NULL, user_id INTEGER NOT NULL, PRIMARY KEY (incident_id, user_id), CONSTRAINT FK_195A51F859E53FB9 FOREIGN KEY (incident_id) REFERENCES incident (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_195A51F8A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_195A51F859E53FB9 ON incident_staff (incident_id)');
        $this->addSql('CREATE INDEX IDX_195A51F8A76ED395 ON incident_staff (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__incident AS SELECT id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id FROM incident');
        $this->addSql('DROP TABLE incident');
        $this->addSql('CREATE TABLE incident (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, severite VARCHAR(20) NOT NULL, statut VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, service_id INTEGER DEFAULT NULL, user_id INTEGER DEFAULT NULL, zone_id INTEGER DEFAULT NULL, CONSTRAINT FK_3D03A11A463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3D03A11AED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3D03A11AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3D03A11A9F2C3FAB FOREIGN KEY (zone_id) REFERENCES zone (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO incident (id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id) SELECT id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id FROM __temp__incident');
        $this->addSql('DROP TABLE __temp__incident');
        $this->addSql('CREATE INDEX IDX_3D03A11AA76ED395 ON incident (user_id)');
        $this->addSql('CREATE INDEX IDX_3D03A11AED5CA9E6 ON incident (service_id)');
        $this->addSql('CREATE INDEX IDX_3D03A11A463CD7C3 ON incident (centre_id)');
        $this->addSql('CREATE INDEX IDX_3D03A11A9F2C3FAB ON incident (zone_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, centre_id INTEGER NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, note CLOB DEFAULT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note) SELECT id, date, heure_debut, heure_fin, statut, centre_id, taux_completion, note FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tutoriel AS SELECT id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id FROM tutoriel');
        $this->addSql('DROP TABLE tutoriel');
        $this->addSql('CREATE TABLE tutoriel (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, titre VARCHAR(200) NOT NULL, niveau VARCHAR(20) NOT NULL, dure_min INTEGER DEFAULT NULL, contenu CLOB NOT NULL, created_at DATETIME NOT NULL, centre_id INTEGER NOT NULL, zone_id INTEGER DEFAULT NULL, CONSTRAINT FK_A2073AED463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_A2073AED9F2C3FAB FOREIGN KEY (zone_id) REFERENCES zone (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tutoriel (id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id) SELECT id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id FROM __temp__tutoriel');
        $this->addSql('DROP TABLE __temp__tutoriel');
        $this->addSql('CREATE INDEX IDX_A2073AED463CD7C3 ON tutoriel (centre_id)');
        $this->addSql('CREATE INDEX IDX_A2073AED9F2C3FAB ON tutoriel (zone_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, centre_id, prenom, taille_haut, taille_bas, pointure, actif FROM user');
        $this->addSql('DROP TABLE user');
        $this->addSql('CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles CLOB NOT NULL, role VARCHAR(20) NOT NULL, avatar_color VARCHAR(20) DEFAULT NULL, points INTEGER NOT NULL, created_at DATETIME NOT NULL, centre_id INTEGER NOT NULL, prenom VARCHAR(100) DEFAULT NULL, taille_haut VARCHAR(10) DEFAULT NULL, taille_bas VARCHAR(10) DEFAULT NULL, pointure VARCHAR(10) DEFAULT NULL, actif BOOLEAN DEFAULT 1 NOT NULL, CONSTRAINT FK_8D93D649463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO user (id, nom, email, password, roles, role, avatar_color, points, created_at, centre_id, prenom, taille_haut, taille_bas, pointure, actif) SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, centre_id, prenom, taille_haut, taille_bas, pointure, actif FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE INDEX IDX_8D93D649463CD7C3 ON user (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON user (email)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE incident_staff');
        $this->addSql('CREATE TEMPORARY TABLE __temp__incident AS SELECT id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id FROM incident');
        $this->addSql('DROP TABLE incident');
        $this->addSql('CREATE TABLE incident (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, severite VARCHAR(20) NOT NULL, statut VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, service_id INTEGER DEFAULT NULL, user_id INTEGER DEFAULT NULL, CONSTRAINT FK_3D03A11A463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3D03A11AED5CA9E6 FOREIGN KEY (service_id) REFERENCES service (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3D03A11AA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO incident (id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id) SELECT id, titre, severite, statut, created_at, resolved_at, centre_id, service_id, user_id FROM __temp__incident');
        $this->addSql('DROP TABLE __temp__incident');
        $this->addSql('CREATE INDEX IDX_3D03A11A463CD7C3 ON incident (centre_id)');
        $this->addSql('CREATE INDEX IDX_3D03A11AED5CA9E6 ON incident (service_id)');
        $this->addSql('CREATE INDEX IDX_3D03A11AA76ED395 ON incident (user_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT \'0\' NOT NULL, note CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__tutoriel AS SELECT id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id FROM tutoriel');
        $this->addSql('DROP TABLE tutoriel');
        $this->addSql('CREATE TABLE tutoriel (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, titre VARCHAR(200) NOT NULL, niveau VARCHAR(20) NOT NULL, dure_min INTEGER DEFAULT NULL, contenu CLOB NOT NULL, created_at DATETIME NOT NULL, centre_id INTEGER NOT NULL, zone_id INTEGER DEFAULT NULL, CONSTRAINT FK_A2073AED463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO tutoriel (id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id) SELECT id, titre, niveau, dure_min, contenu, created_at, centre_id, zone_id FROM __temp__tutoriel');
        $this->addSql('DROP TABLE __temp__tutoriel');
        $this->addSql('CREATE INDEX IDX_A2073AED463CD7C3 ON tutoriel (centre_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__user AS SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, centre_id FROM "user"');
        $this->addSql('DROP TABLE "user"');
        $this->addSql('CREATE TABLE "user" (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles CLOB NOT NULL, role VARCHAR(20) NOT NULL, avatar_color VARCHAR(20) DEFAULT NULL, points INTEGER NOT NULL, created_at DATETIME NOT NULL, prenom VARCHAR(100) DEFAULT NULL, taille_haut VARCHAR(10) DEFAULT NULL, taille_bas VARCHAR(10) DEFAULT NULL, pointure VARCHAR(10) DEFAULT NULL, actif INTEGER DEFAULT 1 NOT NULL, centre_id INTEGER NOT NULL, CONSTRAINT FK_8D93D649463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO "user" (id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, centre_id) SELECT id, nom, email, password, roles, role, avatar_color, points, created_at, prenom, taille_haut, taille_bas, pointure, actif, centre_id FROM __temp__user');
        $this->addSql('DROP TABLE __temp__user');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_8D93D649E7927C74 ON "user" (email)');
        $this->addSql('CREATE INDEX IDX_8D93D649463CD7C3 ON "user" (centre_id)');
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module Support — tables support_ticket, support_reply, support_attachment,
 * ajout de user.last_login_at.
 *
 * Platform-aware :
 *  - MySQL (prod Railway) : CREATE TABLE en syntaxe MySQL, ALTER TABLE.
 *    Le rebuild SQLite de service est un no-op : la table a déjà le bon schéma.
 *  - SQLite (dev local) : comportement auto-generated d'origine conservé à l'identique.
 */
final class Version20260423224605 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Support — support_ticket, support_reply, support_attachment, user.last_login_at';
    }

    public function up(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            // MySQL : support_ticket en premier (référencé par reply et attachment)
            $this->addSql('CREATE TABLE support_ticket (id INT AUTO_INCREMENT NOT NULL, sujet VARCHAR(200) NOT NULL, message LONGTEXT NOT NULL, categorie VARCHAR(30) NOT NULL, statut VARCHAR(20) NOT NULL, priorite VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, closed_at DATETIME DEFAULT NULL, last_viewed_by_super_admin DATETIME DEFAULT NULL, last_viewed_by_author DATETIME DEFAULT NULL, centre_id INT NOT NULL, auteur_id INT NOT NULL, assigne_a_id INT DEFAULT NULL, INDEX IDX_1F5A4D53463CD7C3 (centre_id), INDEX IDX_1F5A4D5360BB6FE6 (auteur_id), INDEX IDX_1F5A4D53BB1B0F33 (assigne_a_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D53463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id)');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D5360BB6FE6 FOREIGN KEY (auteur_id) REFERENCES user (id)');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D53BB1B0F33 FOREIGN KEY (assigne_a_id) REFERENCES user (id)');
            $this->addSql('CREATE TABLE support_reply (id INT AUTO_INCREMENT NOT NULL, message LONGTEXT NOT NULL, interne TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, ticket_id INT NOT NULL, auteur_id INT NOT NULL, INDEX IDX_F12D038700047D2 (ticket_id), INDEX IDX_F12D03860BB6FE6 (auteur_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_reply ADD CONSTRAINT FK_F12D038700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id)');
            $this->addSql('ALTER TABLE support_reply ADD CONSTRAINT FK_F12D03860BB6FE6 FOREIGN KEY (auteur_id) REFERENCES user (id)');
            $this->addSql('CREATE TABLE support_attachment (id INT AUTO_INCREMENT NOT NULL, filename VARCHAR(255) NOT NULL, stored_path VARCHAR(500) NOT NULL, mime_type VARCHAR(100) NOT NULL, size INT NOT NULL, created_at DATETIME NOT NULL, ticket_id INT DEFAULT NULL, reply_id INT DEFAULT NULL, uploaded_by_id INT NOT NULL, INDEX IDX_5BEB1D99700047D2 (ticket_id), INDEX IDX_5BEB1D998A0E4E7F (reply_id), INDEX IDX_5BEB1D99A2B28FE8 (uploaded_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D99700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id)');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D998A0E4E7F FOREIGN KEY (reply_id) REFERENCES support_reply (id)');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D99A2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES user (id)');
            // Le rebuild SQLite de service est un no-op sur MySQL : schéma déjà correct.
            $this->addSql('ALTER TABLE user ADD last_login_at DATETIME DEFAULT NULL');
            return;
        }

        // SQLite (dev local) : comportement auto-generated d'origine conservé.
        $this->addSql('CREATE TABLE support_attachment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, filename VARCHAR(255) NOT NULL, stored_path VARCHAR(500) NOT NULL, mime_type VARCHAR(100) NOT NULL, size INTEGER NOT NULL, created_at DATETIME NOT NULL, ticket_id INTEGER DEFAULT NULL, reply_id INTEGER DEFAULT NULL, uploaded_by_id INTEGER NOT NULL, CONSTRAINT FK_5BEB1D99700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_5BEB1D998A0E4E7F FOREIGN KEY (reply_id) REFERENCES support_reply (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_5BEB1D99A2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_5BEB1D99700047D2 ON support_attachment (ticket_id)');
        $this->addSql('CREATE INDEX IDX_5BEB1D998A0E4E7F ON support_attachment (reply_id)');
        $this->addSql('CREATE INDEX IDX_5BEB1D99A2B28FE8 ON support_attachment (uploaded_by_id)');
        $this->addSql('CREATE TABLE support_reply (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, message CLOB NOT NULL, interne BOOLEAN NOT NULL, created_at DATETIME NOT NULL, ticket_id INTEGER NOT NULL, auteur_id INTEGER NOT NULL, CONSTRAINT FK_F12D038700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_F12D03860BB6FE6 FOREIGN KEY (auteur_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_F12D038700047D2 ON support_reply (ticket_id)');
        $this->addSql('CREATE INDEX IDX_F12D03860BB6FE6 ON support_reply (auteur_id)');
        $this->addSql('CREATE TABLE support_ticket (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, sujet VARCHAR(200) NOT NULL, message CLOB NOT NULL, categorie VARCHAR(30) NOT NULL, statut VARCHAR(20) NOT NULL, priorite VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, closed_at DATETIME DEFAULT NULL, last_viewed_by_super_admin DATETIME DEFAULT NULL, last_viewed_by_author DATETIME DEFAULT NULL, centre_id INTEGER NOT NULL, auteur_id INTEGER NOT NULL, assigne_a_id INTEGER DEFAULT NULL, CONSTRAINT FK_1F5A4D53463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1F5A4D5360BB6FE6 FOREIGN KEY (auteur_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1F5A4D53BB1B0F33 FOREIGN KEY (assigne_a_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_1F5A4D53463CD7C3 ON support_ticket (centre_id)');
        $this->addSql('CREATE INDEX IDX_1F5A4D5360BB6FE6 ON support_ticket (auteur_id)');
        $this->addSql('CREATE INDEX IDX_1F5A4D53BB1B0F33 ON support_ticket (assigne_a_id)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__service AS SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM service');
        $this->addSql('DROP TABLE service');
        $this->addSql('CREATE TABLE service (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, date DATE NOT NULL, heure_debut TIME DEFAULT NULL, heure_fin TIME DEFAULT NULL, statut VARCHAR(20) NOT NULL, taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL, note CLOB DEFAULT NULL, centre_id INTEGER NOT NULL, missions_snapshot CLOB DEFAULT NULL, CONSTRAINT FK_E19D9AD2463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO service (id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot) SELECT id, date, heure_debut, heure_fin, statut, taux_completion, note, centre_id, missions_snapshot FROM __temp__service');
        $this->addSql('DROP TABLE __temp__service');
        $this->addSql('CREATE INDEX IDX_E19D9AD2463CD7C3 ON service (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_service_centre_date ON service (centre_id, date)');
        $this->addSql('ALTER TABLE user ADD COLUMN last_login_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            // MySQL : rollback propre
            $this->addSql('ALTER TABLE support_attachment DROP FOREIGN KEY FK_5BEB1D99700047D2');
            $this->addSql('ALTER TABLE support_attachment DROP FOREIGN KEY FK_5BEB1D998A0E4E7F');
            $this->addSql('ALTER TABLE support_attachment DROP FOREIGN KEY FK_5BEB1D99A2B28FE8');
            $this->addSql('ALTER TABLE support_reply DROP FOREIGN KEY FK_F12D038700047D2');
            $this->addSql('ALTER TABLE support_reply DROP FOREIGN KEY FK_F12D03860BB6FE6');
            $this->addSql('DROP TABLE support_attachment');
            $this->addSql('DROP TABLE support_reply');
            $this->addSql('DROP TABLE support_ticket');
            $this->addSql('ALTER TABLE user DROP COLUMN last_login_at');
            return;
        }

        // SQLite (dev local) : comportement auto-generated d'origine conservé.
        $this->addSql('DROP TABLE support_attachment');
        $this->addSql('DROP TABLE support_reply');
        $this->addSql('DROP TABLE support_ticket');
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
    }
}

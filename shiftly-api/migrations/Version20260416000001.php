<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260416000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Module Planning — horaires sur Poste, contrat sur User, nouvelle table planning_week';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            // MySQL / MariaDB (production Railway)
            $this->addSql('ALTER TABLE poste
                ADD COLUMN heure_debut   TIME         DEFAULT NULL AFTER user_id,
                ADD COLUMN heure_fin     TIME         DEFAULT NULL AFTER heure_debut,
                ADD COLUMN pause_minutes INT NOT NULL DEFAULT 0    AFTER heure_fin
            ');
            $this->addSql('ALTER TABLE `user`
                ADD COLUMN heures_hebdo  INT          DEFAULT NULL AFTER actif,
                ADD COLUMN type_contrat  VARCHAR(30)  DEFAULT NULL AFTER heures_hebdo
            ');
            $this->addSql('CREATE TABLE planning_week (
                id              INT AUTO_INCREMENT NOT NULL,
                centre_id       INT          NOT NULL,
                week_start      DATE         NOT NULL,
                statut          VARCHAR(20)  NOT NULL DEFAULT \'BROUILLON\',
                published_at    DATETIME     DEFAULT NULL,
                published_by_id INT          DEFAULT NULL,
                note            TEXT         DEFAULT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY uniq_pw_centre_week (centre_id, week_start),
                INDEX idx_pw_centre (centre_id),
                INDEX idx_pw_published_by (published_by_id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');
            $this->addSql('ALTER TABLE planning_week
                ADD CONSTRAINT FK_pw_centre       FOREIGN KEY (centre_id)       REFERENCES centre (id),
                ADD CONSTRAINT FK_pw_published_by FOREIGN KEY (published_by_id) REFERENCES `user` (id)
            ');
        } else {
            // SQLite (dev local)
            $this->addSql('ALTER TABLE poste ADD COLUMN heure_debut   TEXT    DEFAULT NULL');
            $this->addSql('ALTER TABLE poste ADD COLUMN heure_fin     TEXT    DEFAULT NULL');
            $this->addSql('ALTER TABLE poste ADD COLUMN pause_minutes INTEGER NOT NULL DEFAULT 0');
            $this->addSql('ALTER TABLE "user" ADD COLUMN heures_hebdo INTEGER DEFAULT NULL');
            $this->addSql('ALTER TABLE "user" ADD COLUMN type_contrat TEXT    DEFAULT NULL');
            $this->addSql('CREATE TABLE planning_week (
                id              INTEGER      NOT NULL,
                centre_id       INTEGER      NOT NULL,
                week_start      TEXT         NOT NULL,
                statut          VARCHAR(20)  NOT NULL DEFAULT \'BROUILLON\',
                published_at    DATETIME     DEFAULT NULL,
                published_by_id INTEGER      DEFAULT NULL,
                note            TEXT         DEFAULT NULL,
                PRIMARY KEY (id AUTOINCREMENT),
                CONSTRAINT FK_pw_centre       FOREIGN KEY (centre_id)       REFERENCES centre (id),
                CONSTRAINT FK_pw_published_by FOREIGN KEY (published_by_id) REFERENCES "user" (id)
            )');
            $this->addSql('CREATE UNIQUE INDEX uniq_pw_centre_week ON planning_week (centre_id, week_start)');
            $this->addSql('CREATE INDEX idx_pw_centre       ON planning_week (centre_id)');
            $this->addSql('CREATE INDEX idx_pw_published_by ON planning_week (published_by_id)');
        }
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('ALTER TABLE planning_week DROP FOREIGN KEY FK_pw_centre');
            $this->addSql('ALTER TABLE planning_week DROP FOREIGN KEY FK_pw_published_by');
            $this->addSql('DROP TABLE planning_week');
            $this->addSql('ALTER TABLE `user`  DROP COLUMN heures_hebdo, DROP COLUMN type_contrat');
            $this->addSql('ALTER TABLE poste   DROP COLUMN heure_debut,  DROP COLUMN heure_fin, DROP COLUMN pause_minutes');
        } else {
            $this->addSql('DROP TABLE planning_week');
            // SQLite ne supporte pas DROP COLUMN avant SQLite 3.35 — recréer les tables si besoin
        }
    }
}

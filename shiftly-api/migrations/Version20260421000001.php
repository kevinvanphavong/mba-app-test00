<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module Pointage — tables pointage et pointage_pause,
 * ajout du champ code_pointage sur la table user.
 */
final class Version20260421000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Module Pointage — tables pointage, pointage_pause, code_pointage sur user';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        if ($isSqlite) {
            $this->addSql('CREATE TABLE pointage (
                id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id     INTEGER NOT NULL,
                service_id    INTEGER NOT NULL,
                poste_id      INTEGER DEFAULT NULL,
                user_id       INTEGER NOT NULL,
                heure_arrivee DATETIME DEFAULT NULL,
                heure_depart  DATETIME DEFAULT NULL,
                statut        VARCHAR(20) NOT NULL DEFAULT \'PREVU\',
                commentaire   TEXT DEFAULT NULL,
                created_at    DATETIME NOT NULL,
                updated_at    DATETIME DEFAULT NULL,
                CONSTRAINT FK_pointage_centre  FOREIGN KEY (centre_id)  REFERENCES centre (id),
                CONSTRAINT FK_pointage_service FOREIGN KEY (service_id) REFERENCES service (id),
                CONSTRAINT FK_pointage_poste   FOREIGN KEY (poste_id)   REFERENCES poste (id),
                CONSTRAINT FK_pointage_user    FOREIGN KEY (user_id)    REFERENCES user (id)
            )');
            $this->addSql('CREATE INDEX idx_pointage_centre_service ON pointage (centre_id, service_id)');

            $this->addSql('CREATE TABLE pointage_pause (
                id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                pointage_id INTEGER NOT NULL,
                heure_debut DATETIME NOT NULL,
                heure_fin   DATETIME DEFAULT NULL,
                type        VARCHAR(20) NOT NULL DEFAULT \'COURTE\',
                CONSTRAINT FK_pause_pointage FOREIGN KEY (pointage_id) REFERENCES pointage (id)
            )');

            $this->addSql('ALTER TABLE user ADD COLUMN code_pointage VARCHAR(4) DEFAULT NULL');
            $this->addSql('CREATE UNIQUE INDEX uniq_user_centre_code ON user (centre_id, code_pointage)');
        } else {
            $this->addSql('CREATE TABLE pointage (
                id            INT AUTO_INCREMENT NOT NULL,
                centre_id     INT NOT NULL,
                service_id    INT NOT NULL,
                poste_id      INT DEFAULT NULL,
                user_id       INT NOT NULL,
                heure_arrivee DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                heure_depart  DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                statut        VARCHAR(20) NOT NULL DEFAULT \'PREVU\',
                commentaire   TEXT DEFAULT NULL,
                created_at    DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                updated_at    DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                INDEX idx_pointage_centre_service (centre_id, service_id),
                PRIMARY KEY (id),
                CONSTRAINT FK_pointage_centre  FOREIGN KEY (centre_id)  REFERENCES centre (id),
                CONSTRAINT FK_pointage_service FOREIGN KEY (service_id) REFERENCES service (id),
                CONSTRAINT FK_pointage_poste   FOREIGN KEY (poste_id)   REFERENCES poste (id) ON DELETE SET NULL,
                CONSTRAINT FK_pointage_user    FOREIGN KEY (user_id)    REFERENCES `user` (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            $this->addSql('CREATE TABLE pointage_pause (
                id          INT AUTO_INCREMENT NOT NULL,
                pointage_id INT NOT NULL,
                heure_debut DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                heure_fin   DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                type        VARCHAR(20) NOT NULL DEFAULT \'COURTE\',
                PRIMARY KEY (id),
                CONSTRAINT FK_pause_pointage FOREIGN KEY (pointage_id) REFERENCES pointage (id) ON DELETE CASCADE
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            $this->addSql('ALTER TABLE `user` ADD code_pointage VARCHAR(4) DEFAULT NULL');
            $this->addSql('CREATE UNIQUE INDEX uniq_user_centre_code ON `user` (centre_id, code_pointage)');
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE pointage_pause');
        $this->addSql('DROP TABLE pointage');
        $this->addSql('DROP INDEX uniq_user_centre_code ON `user`');
        $this->addSql('ALTER TABLE `user` DROP COLUMN code_pointage');
    }
}

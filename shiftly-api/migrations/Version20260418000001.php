<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Conformité juridique — table planning_snapshot pour l'archivage légal des publications.
 * Chaque publication de planning crée un snapshot immuable (JSON + SHA-256).
 * Conservation minimum 3 ans (prescription prud'homale heures supplémentaires).
 */
final class Version20260418000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Archivage légal — création de la table planning_snapshot';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\SqlitePlatform;

        if ($isSqlite) {
            $this->addSql('CREATE TABLE planning_snapshot (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id INTEGER NOT NULL,
                week_start DATE NOT NULL,
                published_at DATETIME NOT NULL,
                published_by INTEGER NOT NULL,
                data CLOB NOT NULL,
                motif_modification CLOB DEFAULT NULL,
                checksum VARCHAR(64) NOT NULL,
                delai_respect BOOLEAN NOT NULL DEFAULT 1,
                CONSTRAINT FK_ps_centre FOREIGN KEY (centre_id) REFERENCES centre (id),
                CONSTRAINT FK_ps_published_by FOREIGN KEY (published_by) REFERENCES user (id)
            )');
            $this->addSql('CREATE INDEX idx_ps_centre_week ON planning_snapshot (centre_id, week_start)');
            $this->addSql('CREATE INDEX idx_ps_published_by ON planning_snapshot (published_by)');
        } else {
            $this->addSql('CREATE TABLE planning_snapshot (
                id INT AUTO_INCREMENT NOT NULL,
                centre_id INT NOT NULL,
                week_start DATE NOT NULL COMMENT \'(DC2Type:date_immutable)\',
                published_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                published_by INT NOT NULL,
                data JSON NOT NULL,
                motif_modification LONGTEXT DEFAULT NULL,
                checksum VARCHAR(64) NOT NULL,
                delai_respect TINYINT(1) NOT NULL DEFAULT 1,
                INDEX idx_ps_centre_week (centre_id, week_start),
                INDEX idx_ps_published_by (published_by),
                PRIMARY KEY (id),
                CONSTRAINT FK_ps_centre FOREIGN KEY (centre_id) REFERENCES centre (id),
                CONSTRAINT FK_ps_published_by FOREIGN KEY (published_by) REFERENCES `user` (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE planning_snapshot');
    }
}

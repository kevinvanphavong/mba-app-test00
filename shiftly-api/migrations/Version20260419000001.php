<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\Migrations\AbstractMigration;

/**
 * Gestion des absences — table absence (CP, RTT, maladie, repos, etc.)
 * Contrainte unique (user_id, date) : une seule absence par jour par employé.
 */
final class Version20260419000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Gestion des absences — création de la table absence';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        if ($isSqlite) {
            $this->addSql('CREATE TABLE absence (
                id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id   INTEGER NOT NULL,
                user_id     INTEGER NOT NULL,
                date        DATE NOT NULL,
                type        VARCHAR(30) NOT NULL,
                motif       VARCHAR(255) DEFAULT NULL,
                created_at  DATETIME NOT NULL,
                created_by  INTEGER DEFAULT NULL,
                CONSTRAINT FK_absence_centre     FOREIGN KEY (centre_id)  REFERENCES centre (id),
                CONSTRAINT FK_absence_user       FOREIGN KEY (user_id)    REFERENCES user (id),
                CONSTRAINT FK_absence_created_by FOREIGN KEY (created_by) REFERENCES user (id)
            )');
            $this->addSql('CREATE UNIQUE INDEX uniq_absence_user_date ON absence (user_id, date)');
            $this->addSql('CREATE INDEX idx_absence_centre ON absence (centre_id)');
            $this->addSql('CREATE INDEX idx_absence_user   ON absence (user_id)');
            $this->addSql('CREATE INDEX idx_absence_date   ON absence (date)');
        } else {
            $this->addSql('CREATE TABLE absence (
                id          INT AUTO_INCREMENT NOT NULL,
                centre_id   INT          NOT NULL,
                user_id     INT          NOT NULL,
                date        DATE         NOT NULL COMMENT \'(DC2Type:date_immutable)\',
                type        VARCHAR(30)  NOT NULL,
                motif       VARCHAR(255) DEFAULT NULL,
                created_at  DATETIME     NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
                created_by  INT          DEFAULT NULL,
                UNIQUE KEY  uniq_absence_user_date (user_id, date),
                INDEX idx_absence_centre (centre_id),
                INDEX idx_absence_user   (user_id),
                INDEX idx_absence_date   (date),
                PRIMARY KEY (id),
                CONSTRAINT FK_absence_centre     FOREIGN KEY (centre_id)  REFERENCES centre (id),
                CONSTRAINT FK_absence_user       FOREIGN KEY (user_id)    REFERENCES `user` (id),
                CONSTRAINT FK_absence_created_by FOREIGN KEY (created_by) REFERENCES `user` (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE absence');
    }
}

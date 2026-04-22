<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Création des tables validation_hebdo et correction_pointage.
 */
final class Version20260422183255 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Module Validation Hebdomadaire — tables validation_hebdo et correction_pointage';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        if ($isSqlite) {
            $this->addSql("CREATE TABLE validation_hebdo (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id          INTEGER NOT NULL,
                user_id            INTEGER NOT NULL,
                semaine            DATE NOT NULL,
                statut             VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
                heures_travaillees INTEGER NOT NULL DEFAULT 0,
                heures_prevues     INTEGER NOT NULL DEFAULT 0,
                ecart              INTEGER NOT NULL DEFAULT 0,
                heures_sup         INTEGER NOT NULL DEFAULT 0,
                nb_retards         INTEGER NOT NULL DEFAULT 0,
                nb_absences        INTEGER NOT NULL DEFAULT 0,
                commentaire        TEXT DEFAULT NULL,
                valide_par_id      INTEGER DEFAULT NULL,
                valide_at          DATETIME DEFAULT NULL,
                created_at         DATETIME NOT NULL,
                updated_at         DATETIME DEFAULT NULL,
                CONSTRAINT FK_vh_centre     FOREIGN KEY (centre_id)     REFERENCES centre (id),
                CONSTRAINT FK_vh_user       FOREIGN KEY (user_id)       REFERENCES user (id),
                CONSTRAINT FK_vh_valide_par FOREIGN KEY (valide_par_id) REFERENCES user (id)
            )");
            $this->addSql('CREATE UNIQUE INDEX uniq_validation_centre_user_semaine ON validation_hebdo (centre_id, user_id, semaine)');

            $this->addSql("CREATE TABLE correction_pointage (
                id              INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                pointage_id     INTEGER NOT NULL,
                champ_modifie   VARCHAR(50) NOT NULL,
                ancienne_valeur DATETIME DEFAULT NULL,
                nouvelle_valeur DATETIME DEFAULT NULL,
                motif           TEXT DEFAULT NULL,
                corrige_par_id  INTEGER NOT NULL,
                created_at      DATETIME NOT NULL,
                CONSTRAINT FK_cp_pointage    FOREIGN KEY (pointage_id)   REFERENCES pointage (id),
                CONSTRAINT FK_cp_corrige_par FOREIGN KEY (corrige_par_id) REFERENCES user (id)
            )");
        } else {
            $this->addSql("CREATE TABLE validation_hebdo (
                id                 INT AUTO_INCREMENT NOT NULL,
                centre_id          INT NOT NULL,
                user_id            INT NOT NULL,
                semaine            DATE NOT NULL,
                statut             VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
                heures_travaillees INT NOT NULL DEFAULT 0,
                heures_prevues     INT NOT NULL DEFAULT 0,
                ecart              INT NOT NULL DEFAULT 0,
                heures_sup         INT NOT NULL DEFAULT 0,
                nb_retards         INT NOT NULL DEFAULT 0,
                nb_absences        INT NOT NULL DEFAULT 0,
                commentaire        TEXT DEFAULT NULL,
                valide_par_id      INT DEFAULT NULL,
                valide_at          DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
                created_at         DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                updated_at         DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
                UNIQUE INDEX uniq_validation_centre_user_semaine (centre_id, user_id, semaine),
                INDEX idx_vh_centre (centre_id),
                INDEX idx_vh_user (user_id),
                INDEX idx_vh_semaine (semaine),
                PRIMARY KEY (id),
                CONSTRAINT FK_vh_centre     FOREIGN KEY (centre_id)     REFERENCES centre (id),
                CONSTRAINT FK_vh_user       FOREIGN KEY (user_id)       REFERENCES `user` (id),
                CONSTRAINT FK_vh_valide_par FOREIGN KEY (valide_par_id) REFERENCES `user` (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");

            $this->addSql("CREATE TABLE correction_pointage (
                id              INT AUTO_INCREMENT NOT NULL,
                pointage_id     INT NOT NULL,
                champ_modifie   VARCHAR(50) NOT NULL,
                ancienne_valeur DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
                nouvelle_valeur DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
                motif           TEXT DEFAULT NULL,
                corrige_par_id  INT NOT NULL,
                created_at      DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                INDEX idx_cp_pointage (pointage_id),
                INDEX idx_cp_corrige_par (corrige_par_id),
                PRIMARY KEY (id),
                CONSTRAINT FK_cp_pointage    FOREIGN KEY (pointage_id)   REFERENCES pointage (id) ON DELETE CASCADE,
                CONSTRAINT FK_cp_corrige_par FOREIGN KEY (corrige_par_id) REFERENCES `user` (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        }
    }

    public function down(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        if (!$isSqlite) {
            $this->addSql('ALTER TABLE correction_pointage DROP FOREIGN KEY FK_cp_pointage');
            $this->addSql('ALTER TABLE correction_pointage DROP FOREIGN KEY FK_cp_corrige_par');
            $this->addSql('ALTER TABLE validation_hebdo DROP FOREIGN KEY FK_vh_valide_par');
            $this->addSql('ALTER TABLE validation_hebdo DROP FOREIGN KEY FK_vh_user');
            $this->addSql('ALTER TABLE validation_hebdo DROP FOREIGN KEY FK_vh_centre');
        }
        $this->addSql('DROP TABLE IF EXISTS correction_pointage');
        $this->addSql('DROP TABLE IF EXISTS validation_hebdo');
    }
}

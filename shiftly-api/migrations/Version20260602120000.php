<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module HACCP MVP — 3 tables : haccp_equipement + mission_haccp_spec + completion_haccp_proof.
 *
 * Aucune colonne SQL ajoutée sur mission / completion (les relations 1-1
 * sont côté inverse — pas de FK sur les entités centrales).
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15 +
 * incident 2026-04-25 RESYNC_SCHEMA).
 */
final class Version20260602120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'HACCP MVP — haccp_equipement + mission_haccp_spec + completion_haccp_proof';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->upMysql();
            return;
        }
        if ($platform instanceof PostgreSQLPlatform) {
            $this->upPostgres();
            return;
        }
        if ($platform instanceof SqlitePlatform) {
            $this->upSqlite();
            return;
        }
        $this->abortIf(true, 'Platform non supportée pour la migration HACCP.');
    }

    private function upMysql(): void
    {
        $this->addSql("CREATE TABLE haccp_equipement (
            id INT AUTO_INCREMENT NOT NULL,
            centre_id INT NOT NULL,
            zone_id INT DEFAULT NULL,
            nom VARCHAR(120) NOT NULL,
            type VARCHAR(20) NOT NULL,
            seuil_min NUMERIC(5,2) NOT NULL,
            seuil_max NUMERIC(5,2) NOT NULL,
            unite VARCHAR(10) NOT NULL DEFAULT '°C',
            ordre INT NOT NULL DEFAULT 0,
            actif TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            INDEX idx_haccp_equip_centre (centre_id, actif),
            INDEX idx_haccp_equip_zone   (zone_id),
            CONSTRAINT FK_haccp_equip_centre FOREIGN KEY (centre_id) REFERENCES centre (id),
            CONSTRAINT FK_haccp_equip_zone   FOREIGN KEY (zone_id)   REFERENCES zone   (id) ON DELETE SET NULL
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE=InnoDB");

        $this->addSql("CREATE TABLE mission_haccp_spec (
            id INT AUTO_INCREMENT NOT NULL,
            mission_id INT NOT NULL,
            centre_id INT NOT NULL,
            equipement_id INT DEFAULT NULL,
            type_releve VARCHAR(20) NOT NULL,
            moment VARCHAR(20) DEFAULT NULL,
            seuil_min NUMERIC(5,2) DEFAULT NULL,
            seuil_max NUMERIC(5,2) DEFAULT NULL,
            unite VARCHAR(10) DEFAULT NULL,
            photo_obligatoire TINYINT(1) NOT NULL DEFAULT 0,
            commentaire_obligatoire TINYINT(1) NOT NULL DEFAULT 0,
            archivee TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_haccp_spec_mission (mission_id),
            INDEX idx_haccp_spec_centre     (centre_id),
            INDEX idx_haccp_spec_equipement (equipement_id),
            CONSTRAINT FK_haccp_spec_mission    FOREIGN KEY (mission_id)    REFERENCES mission           (id) ON DELETE CASCADE,
            CONSTRAINT FK_haccp_spec_centre     FOREIGN KEY (centre_id)     REFERENCES centre            (id),
            CONSTRAINT FK_haccp_spec_equipement FOREIGN KEY (equipement_id) REFERENCES haccp_equipement  (id) ON DELETE CASCADE
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE=InnoDB");

        $this->addSql("CREATE TABLE completion_haccp_proof (
            id INT AUTO_INCREMENT NOT NULL,
            completion_id INT NOT NULL,
            centre_id INT NOT NULL,
            valeur_numerique NUMERIC(5,2) DEFAULT NULL,
            date_releve DATE DEFAULT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            photo_mime_type VARCHAR(50) DEFAULT NULL,
            note LONGTEXT DEFAULT NULL,
            est_conforme TINYINT(1) DEFAULT NULL,
            releve_par_id INT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_haccp_proof_completion (completion_id),
            INDEX idx_haccp_proof_centre_date (centre_id, created_at),
            INDEX idx_haccp_proof_releveur    (releve_par_id),
            CONSTRAINT FK_haccp_proof_completion FOREIGN KEY (completion_id) REFERENCES completion (id) ON DELETE CASCADE,
            CONSTRAINT FK_haccp_proof_centre     FOREIGN KEY (centre_id)     REFERENCES centre     (id),
            CONSTRAINT FK_haccp_proof_user       FOREIGN KEY (releve_par_id) REFERENCES `user`     (id) ON DELETE SET NULL
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE=InnoDB");
    }

    private function upPostgres(): void
    {
        $this->addSql("CREATE TABLE haccp_equipement (
            id SERIAL PRIMARY KEY,
            centre_id INT NOT NULL,
            zone_id INT DEFAULT NULL,
            nom VARCHAR(120) NOT NULL,
            type VARCHAR(20) NOT NULL,
            seuil_min NUMERIC(5,2) NOT NULL,
            seuil_max NUMERIC(5,2) NOT NULL,
            unite VARCHAR(10) NOT NULL DEFAULT '°C',
            ordre INT NOT NULL DEFAULT 0,
            actif BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
        )");
        $this->addSql('CREATE INDEX idx_haccp_equip_centre ON haccp_equipement (centre_id, actif)');
        $this->addSql('CREATE INDEX idx_haccp_equip_zone   ON haccp_equipement (zone_id)');
        $this->addSql('ALTER TABLE haccp_equipement ADD CONSTRAINT FK_haccp_equip_centre FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE haccp_equipement ADD CONSTRAINT FK_haccp_equip_zone   FOREIGN KEY (zone_id) REFERENCES zone (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql("CREATE TABLE mission_haccp_spec (
            id SERIAL PRIMARY KEY,
            mission_id INT NOT NULL,
            centre_id INT NOT NULL,
            equipement_id INT DEFAULT NULL,
            type_releve VARCHAR(20) NOT NULL,
            moment VARCHAR(20) DEFAULT NULL,
            seuil_min NUMERIC(5,2) DEFAULT NULL,
            seuil_max NUMERIC(5,2) DEFAULT NULL,
            unite VARCHAR(10) DEFAULT NULL,
            photo_obligatoire BOOLEAN NOT NULL DEFAULT FALSE,
            commentaire_obligatoire BOOLEAN NOT NULL DEFAULT FALSE,
            archivee BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_haccp_spec_mission ON mission_haccp_spec (mission_id)');
        $this->addSql('CREATE INDEX idx_haccp_spec_centre     ON mission_haccp_spec (centre_id)');
        $this->addSql('CREATE INDEX idx_haccp_spec_equipement ON mission_haccp_spec (equipement_id)');
        $this->addSql('ALTER TABLE mission_haccp_spec ADD CONSTRAINT FK_haccp_spec_mission    FOREIGN KEY (mission_id) REFERENCES mission (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE mission_haccp_spec ADD CONSTRAINT FK_haccp_spec_centre     FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE mission_haccp_spec ADD CONSTRAINT FK_haccp_spec_equipement FOREIGN KEY (equipement_id) REFERENCES haccp_equipement (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');

        $this->addSql("CREATE TABLE completion_haccp_proof (
            id SERIAL PRIMARY KEY,
            completion_id INT NOT NULL,
            centre_id INT NOT NULL,
            valeur_numerique NUMERIC(5,2) DEFAULT NULL,
            date_releve DATE DEFAULT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            photo_mime_type VARCHAR(50) DEFAULT NULL,
            note TEXT DEFAULT NULL,
            est_conforme BOOLEAN DEFAULT NULL,
            releve_par_id INT DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_haccp_proof_completion ON completion_haccp_proof (completion_id)');
        $this->addSql('CREATE INDEX idx_haccp_proof_centre_date ON completion_haccp_proof (centre_id, created_at)');
        $this->addSql('CREATE INDEX idx_haccp_proof_releveur    ON completion_haccp_proof (releve_par_id)');
        $this->addSql('ALTER TABLE completion_haccp_proof ADD CONSTRAINT FK_haccp_proof_completion FOREIGN KEY (completion_id) REFERENCES completion (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE completion_haccp_proof ADD CONSTRAINT FK_haccp_proof_centre     FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE completion_haccp_proof ADD CONSTRAINT FK_haccp_proof_user       FOREIGN KEY (releve_par_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    private function upSqlite(): void
    {
        $this->addSql("CREATE TABLE haccp_equipement (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            centre_id INTEGER NOT NULL,
            zone_id INTEGER DEFAULT NULL,
            nom VARCHAR(120) NOT NULL,
            type VARCHAR(20) NOT NULL,
            seuil_min NUMERIC(5,2) NOT NULL,
            seuil_max NUMERIC(5,2) NOT NULL,
            unite VARCHAR(10) NOT NULL DEFAULT '°C',
            ordre INTEGER NOT NULL DEFAULT 0,
            actif INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (centre_id) REFERENCES centre (id),
            FOREIGN KEY (zone_id)   REFERENCES zone   (id) ON DELETE SET NULL
        )");
        $this->addSql('CREATE INDEX idx_haccp_equip_centre ON haccp_equipement (centre_id, actif)');
        $this->addSql('CREATE INDEX idx_haccp_equip_zone   ON haccp_equipement (zone_id)');

        $this->addSql("CREATE TABLE mission_haccp_spec (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            mission_id INTEGER NOT NULL,
            centre_id INTEGER NOT NULL,
            equipement_id INTEGER DEFAULT NULL,
            type_releve VARCHAR(20) NOT NULL,
            moment VARCHAR(20) DEFAULT NULL,
            seuil_min NUMERIC(5,2) DEFAULT NULL,
            seuil_max NUMERIC(5,2) DEFAULT NULL,
            unite VARCHAR(10) DEFAULT NULL,
            photo_obligatoire INTEGER NOT NULL DEFAULT 0,
            commentaire_obligatoire INTEGER NOT NULL DEFAULT 0,
            archivee INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (mission_id)    REFERENCES mission          (id) ON DELETE CASCADE,
            FOREIGN KEY (centre_id)     REFERENCES centre           (id),
            FOREIGN KEY (equipement_id) REFERENCES haccp_equipement (id) ON DELETE CASCADE
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_haccp_spec_mission ON mission_haccp_spec (mission_id)');
        $this->addSql('CREATE INDEX idx_haccp_spec_centre     ON mission_haccp_spec (centre_id)');
        $this->addSql('CREATE INDEX idx_haccp_spec_equipement ON mission_haccp_spec (equipement_id)');

        $this->addSql("CREATE TABLE completion_haccp_proof (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            completion_id INTEGER NOT NULL,
            centre_id INTEGER NOT NULL,
            valeur_numerique NUMERIC(5,2) DEFAULT NULL,
            date_releve DATE DEFAULT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            photo_mime_type VARCHAR(50) DEFAULT NULL,
            note CLOB DEFAULT NULL,
            est_conforme INTEGER DEFAULT NULL,
            releve_par_id INTEGER DEFAULT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (completion_id) REFERENCES completion (id) ON DELETE CASCADE,
            FOREIGN KEY (centre_id)     REFERENCES centre     (id),
            FOREIGN KEY (releve_par_id) REFERENCES \"user\"   (id) ON DELETE SET NULL
        )");
        $this->addSql('CREATE UNIQUE INDEX uniq_haccp_proof_completion ON completion_haccp_proof (completion_id)');
        $this->addSql('CREATE INDEX idx_haccp_proof_centre_date ON completion_haccp_proof (centre_id, created_at)');
        $this->addSql('CREATE INDEX idx_haccp_proof_releveur    ON completion_haccp_proof (releve_par_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE completion_haccp_proof');
        $this->addSql('DROP TABLE mission_haccp_spec');
        $this->addSql('DROP TABLE haccp_equipement');
    }
}

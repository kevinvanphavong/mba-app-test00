<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Templates de planning (semaine type).
 *
 *  - planning_template       : nom + centre + auteur, unique(centre, nom)
 *  - planning_template_shift : zone + user(nullable) + dayOfWeek + horaires
 *
 * Platform-aware : MySQL (prod) + SQLite (dev local).
 */
final class Version20260427042518 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Templates de planning : tables planning_template + planning_template_shift';
    }

    public function up(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            // ----- MySQL -----
            $this->addSql('CREATE TABLE planning_template (
                id INT AUTO_INCREMENT NOT NULL,
                centre_id INT NOT NULL,
                created_by_id INT NOT NULL,
                nom VARCHAR(100) NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX IDX_PT_CENTRE (centre_id),
                INDEX IDX_PT_CREATED_BY (created_by_id),
                UNIQUE INDEX uniq_planning_template_centre_nom (centre_id, nom),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE planning_template ADD CONSTRAINT FK_PT_CENTRE     FOREIGN KEY (centre_id)     REFERENCES centre (id)');
            $this->addSql('ALTER TABLE planning_template ADD CONSTRAINT FK_PT_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES user (id)');

            $this->addSql('CREATE TABLE planning_template_shift (
                id INT AUTO_INCREMENT NOT NULL,
                template_id INT NOT NULL,
                zone_id INT NOT NULL,
                user_id INT DEFAULT NULL,
                day_of_week SMALLINT NOT NULL,
                heure_debut TIME DEFAULT NULL,
                heure_fin TIME DEFAULT NULL,
                pause_minutes INT DEFAULT 0 NOT NULL,
                INDEX IDX_PTS_TEMPLATE (template_id),
                INDEX IDX_PTS_ZONE (zone_id),
                INDEX IDX_PTS_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE planning_template_shift ADD CONSTRAINT FK_PTS_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE');
            $this->addSql('ALTER TABLE planning_template_shift ADD CONSTRAINT FK_PTS_ZONE     FOREIGN KEY (zone_id)     REFERENCES zone (id)');
            $this->addSql('ALTER TABLE planning_template_shift ADD CONSTRAINT FK_PTS_USER     FOREIGN KEY (user_id)     REFERENCES user (id) ON DELETE SET NULL');
            return;
        }

        // ----- SQLite (dev local) -----
        $this->addSql('CREATE TABLE planning_template (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            centre_id INTEGER NOT NULL,
            created_by_id INTEGER NOT NULL,
            nom VARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL,
            CONSTRAINT FK_PT_CENTRE     FOREIGN KEY (centre_id)     REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_PT_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX IDX_PT_CENTRE     ON planning_template (centre_id)');
        $this->addSql('CREATE INDEX IDX_PT_CREATED_BY ON planning_template (created_by_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_planning_template_centre_nom ON planning_template (centre_id, nom)');

        $this->addSql('CREATE TABLE planning_template_shift (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            template_id INTEGER NOT NULL,
            zone_id INTEGER NOT NULL,
            user_id INTEGER DEFAULT NULL,
            day_of_week SMALLINT NOT NULL,
            heure_debut TIME DEFAULT NULL,
            heure_fin TIME DEFAULT NULL,
            pause_minutes INTEGER DEFAULT 0 NOT NULL,
            CONSTRAINT FK_PTS_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_PTS_ZONE     FOREIGN KEY (zone_id)     REFERENCES zone (id) NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_PTS_USER     FOREIGN KEY (user_id)     REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX IDX_PTS_TEMPLATE ON planning_template_shift (template_id)');
        $this->addSql('CREATE INDEX IDX_PTS_ZONE     ON planning_template_shift (zone_id)');
        $this->addSql('CREATE INDEX IDX_PTS_USER     ON planning_template_shift (user_id)');
    }

    public function down(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            $this->addSql('DROP TABLE planning_template_shift');
            $this->addSql('DROP TABLE planning_template');
            return;
        }
        $this->addSql('DROP TABLE planning_template_shift');
        $this->addSql('DROP TABLE planning_template');
    }
}

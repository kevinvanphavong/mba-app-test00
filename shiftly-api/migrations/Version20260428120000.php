<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajoute la table planning_template_absence pour permettre aux templates de
 * planning de mémoriser et reproduire les absences (REPOS, CP, etc.) en plus
 * des shifts.
 *
 * Platform-aware : MySQL (prod Railway) + SQLite (dev local).
 */
final class Version20260428120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Templates de planning : table planning_template_absence pour copier les jours d\'absence';
    }

    public function up(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            // ----- MySQL -----
            $this->addSql('CREATE TABLE planning_template_absence (
                id INT AUTO_INCREMENT NOT NULL,
                template_id INT NOT NULL,
                user_id INT DEFAULT NULL,
                day_of_week SMALLINT NOT NULL,
                type VARCHAR(30) NOT NULL,
                motif VARCHAR(255) DEFAULT NULL,
                INDEX IDX_PTA_TEMPLATE (template_id),
                INDEX IDX_PTA_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE planning_template_absence ADD CONSTRAINT FK_PTA_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE');
            $this->addSql('ALTER TABLE planning_template_absence ADD CONSTRAINT FK_PTA_USER     FOREIGN KEY (user_id)     REFERENCES user (id) ON DELETE SET NULL');
            return;
        }

        // ----- SQLite (dev local) -----
        $this->addSql('CREATE TABLE planning_template_absence (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            template_id INTEGER NOT NULL,
            user_id INTEGER DEFAULT NULL,
            day_of_week SMALLINT NOT NULL,
            type VARCHAR(30) NOT NULL,
            motif VARCHAR(255) DEFAULT NULL,
            CONSTRAINT FK_PTA_TEMPLATE FOREIGN KEY (template_id) REFERENCES planning_template (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE,
            CONSTRAINT FK_PTA_USER     FOREIGN KEY (user_id)     REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX IDX_PTA_TEMPLATE ON planning_template_absence (template_id)');
        $this->addSql('CREATE INDEX IDX_PTA_USER     ON planning_template_absence (user_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE planning_template_absence');
    }
}

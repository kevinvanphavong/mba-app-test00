<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Suivi des modifications post-publication d'un planning.
 *
 *  - planning_week.last_modified_at DATETIME NULL — bumpé à chaque mutation
 *    (Poste/Absence) via PlanningWeekDirtyListener. Permet de calculer
 *    `hasUnpublishedChanges = lastModifiedAt > publishedAt`.
 *
 * Platform-aware : MySQL (prod) + SQLite (dev local).
 */
final class Version20260428020000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'planning_week.last_modified_at — détection des modifs non publiées';
    }

    public function up(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            $this->addSql('ALTER TABLE planning_week
                ADD last_modified_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'
            ');
            return;
        }
        $this->addSql('ALTER TABLE planning_week ADD COLUMN last_modified_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE planning_week DROP COLUMN last_modified_at');
    }
}

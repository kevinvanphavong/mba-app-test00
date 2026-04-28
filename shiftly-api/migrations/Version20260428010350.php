<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module Photo-validation des missions.
 *
 *  - mission.requires_photo TINYINT(1) NOT NULL DEFAULT 0
 *  - completion.photo_path / photo_mime_type / photo_taken_at (NULL par défaut)
 *
 * Platform-aware : MySQL (prod Railway) + SQLite (dev local).
 */
final class Version20260428010350 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Photo-validation des missions : mission.requires_photo + completion.photo_*';
    }

    public function up(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            // ----- MySQL -----
            $this->addSql('ALTER TABLE mission ADD requires_photo TINYINT(1) NOT NULL DEFAULT 0');
            $this->addSql('ALTER TABLE completion
                ADD photo_path VARCHAR(255) DEFAULT NULL,
                ADD photo_mime_type VARCHAR(50) DEFAULT NULL,
                ADD photo_taken_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'
            ');
            return;
        }

        // ----- SQLite (dev local) -----
        $this->addSql('ALTER TABLE mission ADD COLUMN requires_photo BOOLEAN NOT NULL DEFAULT 0');
        $this->addSql('ALTER TABLE completion ADD COLUMN photo_path VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE completion ADD COLUMN photo_mime_type VARCHAR(50) DEFAULT NULL');
        $this->addSql('ALTER TABLE completion ADD COLUMN photo_taken_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        if (!$this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            $this->addSql('ALTER TABLE mission DROP COLUMN requires_photo');
            $this->addSql('ALTER TABLE completion
                DROP COLUMN photo_path,
                DROP COLUMN photo_mime_type,
                DROP COLUMN photo_taken_at
            ');
            return;
        }

        // SQLite : DROP COLUMN supporté depuis 3.35 (assez récent)
        $this->addSql('ALTER TABLE mission DROP COLUMN requires_photo');
        $this->addSql('ALTER TABLE completion DROP COLUMN photo_path');
        $this->addSql('ALTER TABLE completion DROP COLUMN photo_mime_type');
        $this->addSql('ALTER TABLE completion DROP COLUMN photo_taken_at');
    }
}

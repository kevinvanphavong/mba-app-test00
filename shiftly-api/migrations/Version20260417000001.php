<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260417000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Service — ajout missions_snapshot (JSON) pour historique et analyse dashboard';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('ALTER TABLE service ADD COLUMN missions_snapshot LONGTEXT DEFAULT NULL');
        } else {
            // SQLite (dev local)
            $this->addSql('ALTER TABLE service ADD COLUMN missions_snapshot TEXT DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('ALTER TABLE service DROP COLUMN missions_snapshot');
        }
        // SQLite : DROP COLUMN non supporté avant 3.35, ignorer
    }
}

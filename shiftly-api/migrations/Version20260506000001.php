<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * correction_pointage — ajout de pause_id (FK nullable vers pointage_pause).
 *
 * Permet de tracer la cible exacte d'une correction sur une pause :
 * un pointage peut avoir plusieurs pauses, le `champModifie` seul ne suffit
 * plus. ON DELETE SET NULL : si une pause disparaît, la ligne d'audit
 * subsiste avec pause_id = NULL.
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 */
final class Version20260506000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'correction_pointage — ajout de pause_id (FK nullable vers pointage_pause)';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SqlitePlatform) {
            // SQLite supporte les FK inline dans ALTER TABLE ADD COLUMN
            $this->addSql(
                'ALTER TABLE correction_pointage ADD COLUMN pause_id INTEGER DEFAULT NULL '
                . 'REFERENCES pointage_pause (id) ON DELETE SET NULL'
            );
            $this->addSql('CREATE INDEX idx_cp_pause ON correction_pointage (pause_id)');
            return;
        }

        // MySQL & PostgreSQL : syntaxe identique pour ADD column / ADD CONSTRAINT / CREATE INDEX
        $this->addSql('ALTER TABLE correction_pointage ADD pause_id INT DEFAULT NULL');
        $this->addSql(
            'ALTER TABLE correction_pointage ADD CONSTRAINT fk_cp_pause '
            . 'FOREIGN KEY (pause_id) REFERENCES pointage_pause (id) ON DELETE SET NULL'
        );
        $this->addSql('CREATE INDEX idx_cp_pause ON correction_pointage (pause_id)');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SqlitePlatform) {
            $this->addSql('DROP INDEX IF EXISTS idx_cp_pause');
            $this->addSql('ALTER TABLE correction_pointage DROP COLUMN pause_id');
            return;
        }

        if ($platform instanceof PostgreSQLPlatform) {
            $this->addSql('ALTER TABLE correction_pointage DROP CONSTRAINT fk_cp_pause');
            $this->addSql('DROP INDEX IF EXISTS idx_cp_pause');
            $this->addSql('ALTER TABLE correction_pointage DROP COLUMN pause_id');
            return;
        }

        // MySQL
        $this->addSql('ALTER TABLE correction_pointage DROP FOREIGN KEY fk_cp_pause');
        $this->addSql('DROP INDEX idx_cp_pause ON correction_pointage');
        $this->addSql('ALTER TABLE correction_pointage DROP COLUMN pause_id');
    }
}

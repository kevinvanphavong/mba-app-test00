<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Pointage : ajoute pointe_par_id pour tracer l'utilisateur authentifié qui a
 * déclenché l'action de pointage (PIN normal, bypass manager). Les rectifications
 * a posteriori restent tracées séparément dans CorrectionPointage.corrigePar.
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 */
final class Version20260529025145 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Pointage — ajoute pointe_par_id (User nullable, ON DELETE SET NULL)';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('ALTER TABLE pointage
                ADD COLUMN pointe_par_id INT DEFAULT NULL AFTER heure_depart
            ');
            $this->addSql('ALTER TABLE pointage
                ADD CONSTRAINT FK_pointage_pointe_par FOREIGN KEY (pointe_par_id) REFERENCES `user` (id) ON DELETE SET NULL
            ');
        } elseif ($platform instanceof SqlitePlatform) {
            // SQLite : ALTER ADD COLUMN ne supporte pas l'inline FK proprement,
            // mais l'intégrité référentielle reste appliquée par Doctrine côté ORM.
            $this->addSql('ALTER TABLE pointage ADD COLUMN pointe_par_id INTEGER DEFAULT NULL REFERENCES "user" (id) ON DELETE SET NULL');
        } else {
            // PostgreSQL
            $this->addSql('ALTER TABLE pointage ADD COLUMN pointe_par_id INT DEFAULT NULL');
            $this->addSql('ALTER TABLE pointage
                ADD CONSTRAINT FK_pointage_pointe_par FOREIGN KEY (pointe_par_id) REFERENCES "user" (id) ON DELETE SET NULL
            ');
        }

        $this->addSql('CREATE INDEX idx_pointage_pointe_par ON pointage (pointe_par_id)');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('ALTER TABLE pointage DROP FOREIGN KEY FK_pointage_pointe_par');
            $this->addSql('DROP INDEX idx_pointage_pointe_par ON pointage');
            $this->addSql('ALTER TABLE pointage DROP COLUMN pointe_par_id');
        } elseif ($platform instanceof SqlitePlatform) {
            $this->addSql('DROP INDEX idx_pointage_pointe_par');
            $this->addSql('ALTER TABLE pointage DROP COLUMN pointe_par_id');
        } else {
            // PostgreSQL
            $this->addSql('ALTER TABLE pointage DROP CONSTRAINT FK_pointage_pointe_par');
            $this->addSql('DROP INDEX idx_pointage_pointe_par');
            $this->addSql('ALTER TABLE pointage DROP COLUMN pointe_par_id');
        }
    }
}

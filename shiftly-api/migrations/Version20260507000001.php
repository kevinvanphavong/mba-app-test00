<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Staff v2 :
 *   - user.date_embauche (DATE nullable) → calcul d'ancienneté front
 *   - centre.tenue_haut, tenue_bas, tenue_chaussures (VARCHAR(120) nullable)
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 * SQL portable : pas de __temp__ table, pas d'identifiants quotés SQLite.
 */
final class Version20260507000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Staff v2 — date_embauche sur user, tenue_* sur centre';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        // user.date_embauche
        if ($isSqlite) {
            $this->addSql('ALTER TABLE user ADD COLUMN date_embauche DATE DEFAULT NULL');
        } else {
            $this->addSql('ALTER TABLE `user` ADD date_embauche DATE DEFAULT NULL');
        }

        // centre.tenue_haut / tenue_bas / tenue_chaussures
        $this->addSql('ALTER TABLE centre ADD tenue_haut VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD tenue_bas VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD tenue_chaussures VARCHAR(120) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        $this->addSql('ALTER TABLE centre DROP COLUMN tenue_chaussures');
        $this->addSql('ALTER TABLE centre DROP COLUMN tenue_bas');
        $this->addSql('ALTER TABLE centre DROP COLUMN tenue_haut');

        if ($isSqlite) {
            $this->addSql('ALTER TABLE user DROP COLUMN date_embauche');
        } else {
            $this->addSql('ALTER TABLE `user` DROP COLUMN date_embauche');
        }
    }
}

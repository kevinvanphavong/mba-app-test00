<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Registre du personnel — 12 colonnes RH nullables sur `user`.
 * (Art. L1221-13 et D1221-23 du Code du travail.)
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15 +
 * incident 2026-04-25 RESYNC_SCHEMA).
 */
final class Version20260605022101 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Registre du personnel — 12 colonnes RH sur user';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql("ALTER TABLE `user`
                ADD date_naissance DATE DEFAULT NULL,
                ADD lieu_naissance_commune VARCHAR(120) DEFAULT NULL,
                ADD lieu_naissance_departement VARCHAR(60) DEFAULT NULL,
                ADD sexe VARCHAR(1) DEFAULT NULL,
                ADD nationalite VARCHAR(60) DEFAULT NULL,
                ADD emploi VARCHAR(120) DEFAULT NULL,
                ADD adresse VARCHAR(255) DEFAULT NULL,
                ADD code_postal VARCHAR(10) DEFAULT NULL,
                ADD ville VARCHAR(120) DEFAULT NULL,
                ADD telephone VARCHAR(20) DEFAULT NULL,
                ADD date_sortie DATE DEFAULT NULL,
                ADD motif_sortie VARCHAR(40) DEFAULT NULL
            ");
            return;
        }
        if ($platform instanceof PostgreSQLPlatform) {
            foreach ([
                'date_naissance DATE DEFAULT NULL',
                'lieu_naissance_commune VARCHAR(120) DEFAULT NULL',
                'lieu_naissance_departement VARCHAR(60) DEFAULT NULL',
                'sexe VARCHAR(1) DEFAULT NULL',
                'nationalite VARCHAR(60) DEFAULT NULL',
                'emploi VARCHAR(120) DEFAULT NULL',
                'adresse VARCHAR(255) DEFAULT NULL',
                'code_postal VARCHAR(10) DEFAULT NULL',
                'ville VARCHAR(120) DEFAULT NULL',
                'telephone VARCHAR(20) DEFAULT NULL',
                'date_sortie DATE DEFAULT NULL',
                'motif_sortie VARCHAR(40) DEFAULT NULL',
            ] as $col) {
                $this->addSql("ALTER TABLE \"user\" ADD $col");
            }
            return;
        }
        if ($platform instanceof SqlitePlatform) {
            foreach ([
                'date_naissance DATE DEFAULT NULL',
                'lieu_naissance_commune VARCHAR(120) DEFAULT NULL',
                'lieu_naissance_departement VARCHAR(60) DEFAULT NULL',
                'sexe VARCHAR(1) DEFAULT NULL',
                'nationalite VARCHAR(60) DEFAULT NULL',
                'emploi VARCHAR(120) DEFAULT NULL',
                'adresse VARCHAR(255) DEFAULT NULL',
                'code_postal VARCHAR(10) DEFAULT NULL',
                'ville VARCHAR(120) DEFAULT NULL',
                'telephone VARCHAR(20) DEFAULT NULL',
                'date_sortie DATE DEFAULT NULL',
                'motif_sortie VARCHAR(40) DEFAULT NULL',
            ] as $col) {
                $this->addSql("ALTER TABLE \"user\" ADD COLUMN $col");
            }
            return;
        }
        $this->abortIf(true, 'Platform non supportée pour la migration Registre.');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();
        $cols = [
            'date_naissance', 'lieu_naissance_commune', 'lieu_naissance_departement',
            'sexe', 'nationalite', 'emploi', 'adresse', 'code_postal', 'ville',
            'telephone', 'date_sortie', 'motif_sortie',
        ];

        if ($platform instanceof AbstractMySQLPlatform) {
            $drops = implode(', ', array_map(static fn(string $c) => "DROP $c", $cols));
            $this->addSql("ALTER TABLE `user` $drops");
            return;
        }
        // PostgreSQL et SQLite acceptent un DROP COLUMN par instruction.
        foreach ($cols as $c) {
            $this->addSql("ALTER TABLE \"user\" DROP COLUMN $c");
        }
    }
}

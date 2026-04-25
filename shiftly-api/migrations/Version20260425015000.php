<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rattrapage prod (suite) : synchronise idempotemment toutes les colonnes
 * attendues sur la table `user`.
 *
 * Contexte : `migrations:version --add --all` dans l'entrypoint a marqué
 * d'anciennes migrations comme exécutées sans appliquer leur SQL. Plusieurs
 * colonnes manquent réellement (prenom, taille_*, pointure, actif,
 * heures_hebdo, type_contrat, code_pointage, avatar_color, last_login_at).
 *
 * SQLite (dev) : no-op.
 */
final class Version20260425015000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rattrapage user.* (colonnes manquantes en prod, MySQL only)';
    }

    public function up(Schema $schema): void
    {
        if ($this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            return;
        }

        $expected = [
            'avatar_color'  => "VARCHAR(20) DEFAULT NULL",
            'prenom'        => "VARCHAR(100) DEFAULT NULL",
            'taille_haut'   => "VARCHAR(10) DEFAULT NULL",
            'taille_bas'    => "VARCHAR(10) DEFAULT NULL",
            'pointure'      => "VARCHAR(10) DEFAULT NULL",
            'actif'         => "TINYINT(1) DEFAULT 1 NOT NULL",
            'heures_hebdo'  => "INT DEFAULT NULL",
            'type_contrat'  => "VARCHAR(30) DEFAULT NULL",
            'code_pointage' => "VARCHAR(4) DEFAULT NULL",
            'last_login_at' => "DATETIME DEFAULT NULL",
        ];

        $dbName = $this->connection->getDatabase();

        foreach ($expected as $col => $definition) {
            $exists = (int) $this->connection->fetchOne(
                'SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [$dbName, 'user', $col]
            );
            if ($exists === 0) {
                $this->addSql(sprintf('ALTER TABLE user ADD %s %s', $col, $definition));
            }
        }
    }

    public function down(Schema $schema): void
    {
        // Pas de rollback : migration de rattrapage idempotente.
    }
}

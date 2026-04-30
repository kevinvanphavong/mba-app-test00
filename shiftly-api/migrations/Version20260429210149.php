<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\Migrations\AbstractMigration;

/**
 * Pointage — retrait de la contrainte UNIQUE(centre_id, code_pointage) sur user
 * et backfill du code_pointage à "0000" pour les staff existants.
 *
 * La contrainte UNIQUE n'était pas utilisée par la logique de pointage
 * (qui identifie déjà l'employé via pointage.user_id avant la saisie du PIN).
 * On la retire pour autoriser un PIN par défaut "0000" partagé à la création.
 */
final class Version20260429210149 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Pointage — retrait de l\'index UNIQUE sur (centre_id, code_pointage) + backfill "0000"';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        // L'index peut avoir disparu via un rebuild de table SQLite antérieur,
        // donc on ne le drop que s'il existe.
        $hasIndex = false;
        foreach ($this->connection->createSchemaManager()->listTableIndexes('user') as $index) {
            if ($index->getName() === 'uniq_user_centre_code') {
                $hasIndex = true;
                break;
            }
        }

        if ($hasIndex) {
            if ($isSqlite) {
                $this->addSql('DROP INDEX uniq_user_centre_code');
            } else {
                $this->addSql('DROP INDEX uniq_user_centre_code ON `user`');
            }
        }

        if ($isSqlite) {
            $this->addSql("UPDATE user SET code_pointage = '0000' WHERE code_pointage IS NULL");
        } else {
            $this->addSql("UPDATE `user` SET code_pointage = '0000' WHERE code_pointage IS NULL");
        }
    }

    public function down(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        // Avant de recréer l'index UNIQUE, on remet à NULL les codes "0000" pour éviter les doublons.
        if ($isSqlite) {
            $this->addSql("UPDATE user SET code_pointage = NULL WHERE code_pointage = '0000'");
            $this->addSql('CREATE UNIQUE INDEX uniq_user_centre_code ON user (centre_id, code_pointage)');
        } else {
            $this->addSql("UPDATE `user` SET code_pointage = NULL WHERE code_pointage = '0000'");
            $this->addSql('CREATE UNIQUE INDEX uniq_user_centre_code ON `user` (centre_id, code_pointage)');
        }
    }
}

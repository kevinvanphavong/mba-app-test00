<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module Media — création de la table polymorphe media.
 *
 * - Pas de FK vers mission/tutoriel : relation logique via (entity_type, entity_id)
 * - FK vers centre et user (uploaded_by) avec ON DELETE CASCADE sur user
 * - VARCHAR(20) pour entity_type (pas d'ENUM MySQL — règle 15)
 * - Index composé (entity_type, entity_id, centre_id) pour les listings sub-resource
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 */
final class Version20260507120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Module Media — table media (polymorphe mission/tutoriel/document)';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        if ($isSqlite) {
            $this->addSql(<<<'SQL'
                CREATE TABLE media (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    centre_id INTEGER NOT NULL,
                    uploaded_by_id INTEGER NOT NULL,
                    entity_type VARCHAR(20) NOT NULL,
                    entity_id INTEGER NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    mime_type VARCHAR(100) NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    storage_path VARCHAR(500) NOT NULL,
                    created_at DATETIME NOT NULL,
                    CONSTRAINT FK_media_centre FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE,
                    CONSTRAINT FK_media_user FOREIGN KEY (uploaded_by_id) REFERENCES user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
                )
            SQL);
            $this->addSql('CREATE INDEX idx_media_entity ON media (entity_type, entity_id, centre_id)');
            $this->addSql('CREATE INDEX IDX_6A2CA10C463CD7C3 ON media (centre_id)');
            $this->addSql('CREATE INDEX IDX_6A2CA10CA2B28FE8 ON media (uploaded_by_id)');
            return;
        }

        // MySQL / PostgreSQL — SQL portable, pas de spécifique MySQL (ENUM, etc.)
        $this->addSql(<<<'SQL'
            CREATE TABLE media (
                id INT AUTO_INCREMENT NOT NULL,
                centre_id INT NOT NULL,
                uploaded_by_id INT NOT NULL,
                entity_type VARCHAR(20) NOT NULL,
                entity_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size_bytes INT NOT NULL,
                storage_path VARCHAR(500) NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_media_entity (entity_type, entity_id, centre_id),
                INDEX IDX_6A2CA10C463CD7C3 (centre_id),
                INDEX IDX_6A2CA10CA2B28FE8 (uploaded_by_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql('ALTER TABLE media ADD CONSTRAINT FK_media_centre FOREIGN KEY (centre_id) REFERENCES centre (id)');
        $this->addSql('ALTER TABLE media ADD CONSTRAINT FK_media_user FOREIGN KEY (uploaded_by_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE media');
    }
}

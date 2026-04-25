<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rattrapage prod : la migration Version20260423224605 a pu être marquée
 * comme exécutée via `migrations:version --add --all` (fallback entrypoint
 * quand l'historique Doctrine est vide) sans que la colonne user.last_login_at
 * et les tables support_* soient réellement créées.
 *
 * Cette migration ajoute idempotemment ce qui manque côté MySQL (prod Railway).
 * Côté SQLite (dev), no-op : la migration d'origine a réellement tourné.
 */
final class Version20260425013000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rattrapage : user.last_login_at + tables support_* si manquantes (MySQL only)';
    }

    public function up(Schema $schema): void
    {
        if ($this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            return;
        }

        $dbName = $this->connection->getDatabase();

        // user.last_login_at
        $hasCol = (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$dbName, 'user', 'last_login_at']
        );
        if ($hasCol === 0) {
            $this->addSql('ALTER TABLE user ADD last_login_at DATETIME DEFAULT NULL');
        }

        // support_ticket
        if (!$this->tableExists($dbName, 'support_ticket')) {
            $this->addSql('CREATE TABLE support_ticket (id INT AUTO_INCREMENT NOT NULL, sujet VARCHAR(200) NOT NULL, message LONGTEXT NOT NULL, categorie VARCHAR(30) NOT NULL, statut VARCHAR(20) NOT NULL, priorite VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, closed_at DATETIME DEFAULT NULL, last_viewed_by_super_admin DATETIME DEFAULT NULL, last_viewed_by_author DATETIME DEFAULT NULL, centre_id INT NOT NULL, auteur_id INT NOT NULL, assigne_a_id INT DEFAULT NULL, INDEX IDX_1F5A4D53463CD7C3 (centre_id), INDEX IDX_1F5A4D5360BB6FE6 (auteur_id), INDEX IDX_1F5A4D53BB1B0F33 (assigne_a_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D53463CD7C3 FOREIGN KEY (centre_id) REFERENCES centre (id)');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D5360BB6FE6 FOREIGN KEY (auteur_id) REFERENCES user (id)');
            $this->addSql('ALTER TABLE support_ticket ADD CONSTRAINT FK_1F5A4D53BB1B0F33 FOREIGN KEY (assigne_a_id) REFERENCES user (id)');
        }

        // support_reply
        if (!$this->tableExists($dbName, 'support_reply')) {
            $this->addSql('CREATE TABLE support_reply (id INT AUTO_INCREMENT NOT NULL, message LONGTEXT NOT NULL, interne TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, ticket_id INT NOT NULL, auteur_id INT NOT NULL, INDEX IDX_F12D038700047D2 (ticket_id), INDEX IDX_F12D03860BB6FE6 (auteur_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_reply ADD CONSTRAINT FK_F12D038700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id)');
            $this->addSql('ALTER TABLE support_reply ADD CONSTRAINT FK_F12D03860BB6FE6 FOREIGN KEY (auteur_id) REFERENCES user (id)');
        }

        // support_attachment
        if (!$this->tableExists($dbName, 'support_attachment')) {
            $this->addSql('CREATE TABLE support_attachment (id INT AUTO_INCREMENT NOT NULL, filename VARCHAR(255) NOT NULL, stored_path VARCHAR(500) NOT NULL, mime_type VARCHAR(100) NOT NULL, size INT NOT NULL, created_at DATETIME NOT NULL, ticket_id INT DEFAULT NULL, reply_id INT DEFAULT NULL, uploaded_by_id INT NOT NULL, INDEX IDX_5BEB1D99700047D2 (ticket_id), INDEX IDX_5BEB1D998A0E4E7F (reply_id), INDEX IDX_5BEB1D99A2B28FE8 (uploaded_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D99700047D2 FOREIGN KEY (ticket_id) REFERENCES support_ticket (id)');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D998A0E4E7F FOREIGN KEY (reply_id) REFERENCES support_reply (id)');
            $this->addSql('ALTER TABLE support_attachment ADD CONSTRAINT FK_5BEB1D99A2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES user (id)');
        }
    }

    public function down(Schema $schema): void
    {
        // Pas de rollback : migration de rattrapage idempotente.
    }

    private function tableExists(string $dbName, string $table): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
            [$dbName, $table]
        ) > 0;
    }
}
